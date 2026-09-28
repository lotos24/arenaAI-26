import { create } from 'zustand';
import type { InitProgressReport, MLCEngineInterface } from '@mlc-ai/web-llm';
import { Choice, Config, interestsFor, outcome, respond, scenarioFor, SESSION_STAGE_COUNT, stages, tension, Turn } from './engine';

/**
 * On-device opponent: a small instruct model runs in the browser through WebGPU (WebLLM).
 * No keys and no server. Weights are downloaded once into Cache Storage; without WebGPU,
 * or whenever the model fails, the deterministic scenario engine answers instead.
 */
/**
 * Two builds of Qwen2.5-Instruct. 0.5B is the fast minimum; in our checks its Russian was often broken,
 * so 1.5B is the default. The f32 variant is picked when the GPU has no f16 shaders.
 */
export const LOCAL_MODEL_OPTIONS = {
  quality: { label: 'Качественная · Qwen2.5-1.5B', size: '≈1 ГБ', f16: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', f32: 'Qwen2.5-1.5B-Instruct-q4f32_1-MLC' },
  light: { label: 'Быстрая · Qwen2.5-0.5B', size: '≈0,4 ГБ', f16: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC', f32: 'Qwen2.5-0.5B-Instruct-q4f32_1-MLC' },
} as const;
export type LocalModelTier = keyof typeof LOCAL_MODEL_OPTIONS;
const ENABLED_KEY = 'arena-local-ai';
const TIER_KEY = 'arena-local-model';
const MAX_HISTORY_TURNS = 4;
const MAX_FIELD = 400;
const GENERATION_TIMEOUT_MS = 25_000;

export type LocalAiStatus = 'checking' | 'unsupported' | 'idle' | 'loading' | 'ready' | 'error';
type LocalAiState = { status: LocalAiStatus; enabled: boolean; cached: boolean; progress: number; stage: string; tier: LocalModelTier; f16: boolean; model: string; gpu: string; error: string };
export const useLocalAi = create<LocalAiState>(() => ({ status: 'checking', enabled: false, cached: false, progress: 0, stage: '', tier: 'quality', f16: true, model: LOCAL_MODEL_OPTIONS.quality.f16, gpu: '', error: '' }));
const modelFor = (tier: LocalModelTier, f16: boolean) => LOCAL_MODEL_OPTIONS[tier][f16 ? 'f16' : 'f32'];

let engine: MLCEngineInterface | null = null;
let loading: Promise<void> | null = null;

// ---------- prompt: pure and testable ----------

export type LocalMessage = { role: 'system' | 'user'; content: string };
const clip = (value: string, limit = MAX_FIELD) => value.replace(/\s+/g, ' ').trim().slice(0, limit);

/** Validates the negotiation context before it reaches the model; returns a readable problem or null. */
export function validateLocalContext(config: Config, turns: Turn[], choice: Choice, stage: number) {
  if (!config.topic.trim() || !config.role.trim() || !config.goal.trim()) return 'В сценарии не заполнены тема, роль или цель.';
  if (!Number.isInteger(stage) || stage < 0 || stage >= SESSION_STAGE_COUNT) return 'Этап переговоров вне диапазона.';
  if (turns.length !== stage) return 'История ходов не совпадает с этапом.';
  if (!choice.text.trim()) return 'Пустая реплика игрока.';
  return null;
}

/** System and user messages for the local model: persona, goal, tone, recent history and the scripted anchor. */
export function buildLocalPrompt(config: Config, turns: Turn[], choice: Choice, stage: number): LocalMessage[] {
  const scenario = scenarioFor(config);
  const projected: Turn[] = [...turns, { ...choice, reply: '' }];
  const trust = outcome(config, projected).trust;
  const pressure = tension(config, projected);
  const anchor = respond(config, stage, choice, trust);
  const touched = (choice.interests ?? []).map(id => interestsFor(config).find(item => item.id === id)?.label).filter(Boolean);
  const history = turns.slice(-MAX_HISTORY_TURNS).map(turn => `Игрок: ${clip(turn.text, 240)}\nТы: ${clip(turn.reply, 240)}`).join('\n');
  const female = personaGender(scenario.person) === 'female';
  const mood = pressure >= 70 ? (female ? 'ты раздражена и близка к тому, чтобы прервать встречу' : 'ты раздражён и близок к тому, чтобы прервать встречу')
    : pressure >= 45 ? (female ? 'ты насторожена' : 'ты насторожен') : (female ? 'ты открыта к диалогу' : 'ты открыт к диалогу');
  // Small models copy the player's line when it comes right before the task, so the player's words are
  // given as context and the task is to retell the opponent's own draft reply.
  return [
    { role: 'system', content: [
      `Ты — ${clip(scenario.person, 60)}, ${clip(config.role.toLowerCase(), 120)}. Идут деловые переговоры на тему «${clip(config.topic, 120)}». Говори о себе в ${female ? 'женском' : 'мужском'} роде и обращайся к собеседнику на «вы».`,
      `Твоя цель: ${clip(config.goal, 200)}. Тон: ${config.tone.toLowerCase()}. Сейчас ${mood}.`,
      'Отвечай только по-русски, от первого лица, 2–3 коротких предложения живой деловой речи. Без списков, без кавычек, без пояснений в скобках.',
      'Не упоминай, что ты модель, программа или симуляция. Не соглашайся с тем, что игрок ещё не предложил, и не повторяй его слова.',
    ].join(' ') },
    { role: 'user', content: [
      history ? `Ход разговора:\n${history}` : `Ты начал разговор словами: ${clip(scenario.opening, 300)}`,
      `Этап: ${stages[stage]}. Контекст: собеседник только что сказал тебе: «${clip(choice.text, 220)}»`,
      touched.length ? `Собеседник затронул твой скрытый интерес (${touched.join('; ')}) — признай это.` : '',
      `Твоя реплика в ответ (черновик): «${clip(anchor)}»`,
      'Перескажи свою реплику короче и живее, 2–3 предложения, своими словами. Не пересказывай слова собеседника. Выведи только текст реплики.',
    ].filter(Boolean).join('\n\n') },
  ];
}

const STOP_STEMS = new Set(['котор', 'также', 'между', 'чтобы', 'может', 'будет', 'очень', 'давай', 'нужно', 'важно', 'можно', 'сейча', 'этого', 'этому', 'всего']);
const stemsOf = (text: string) => new Set((text.toLowerCase().replace(/ё/g, 'е').match(/[а-я]{5,}/g) ?? []).map(word => word.slice(0, 5)).filter(stem => !STOP_STEMS.has(stem)));
/** A reply must share meaning with the scripted anchor: small models otherwise drift or swap roles. */
export function sharesMeaning(reply: string, anchor: string) {
  const expected = stemsOf(anchor);
  let shared = 0;
  for (const stem of stemsOf(reply)) if (expected.has(stem)) shared++;
  return shared >= 2;
}
const firstWords = (text: string) => (text.toLowerCase().replace(/ё/g, 'е').match(/[а-яa-z0-9]+/g) ?? []).slice(0, 5).join(' ');
/** Small models like to repeat the player's line back; a shared greeting is fine, a copied line is not. */
export function echoesPlayer(reply: string, player: string, anchor = '') {
  if (!player) return false;
  if (firstWords(reply) !== '' && firstWords(reply) === firstWords(player)) return true;
  // Words the draft reply also uses are legitimate content, only the player's own words count as copying.
  const own = stemsOf(reply);
  const legit = stemsOf(anchor);
  const theirs = new Set([...stemsOf(player)].filter(stem => !legit.has(stem)));
  let copied = 0;
  for (const stem of own) if (theirs.has(stem)) copied++;
  return own.size > 0 && copied / own.size >= .6;
}
/** Conflict moves keep their deterministic reply: small models tend to agree with ultimatums. */
export function needsScriptedReply(choice: Choice) {
  return choice.trust < 0 || ['insult', 'threat', 'demand', 'silence', 'vague'].includes(choice.intent ?? '');
}
const FEMALE_EXCEPTIONS = new Set(['илья', 'никита', 'кузьма', 'фома', 'лука', 'савва', 'данила']);
/** Grammatical gender from the first name, so the model says «готов» or «готова» correctly. */
export function personaGender(person: string): 'male' | 'female' {
  const first = person.trim().split(/\s+/)[0]?.toLowerCase() ?? '';
  return /[ая]$/.test(first) && !FEMALE_EXCEPTIONS.has(first) ? 'female' : 'male';
}

/** Cleans a model answer; returns null when it is unusable (wrong script, empty, too short, off the anchor's meaning). */
export function sanitizeLocalReply(raw: string, anchor?: string, player?: string) {
  let text = raw.replace(/\*\*|__|`/g, '').replace(/^\s*(?:ты|собеседник|ответ|[А-ЯЁA-Z][а-яёa-z]+(?: [А-ЯЁA-Z][а-яёa-z]+)?)\s*:\s*/u, '').replace(/^["«„]+|["»“]+$/g, '').replace(/\s+/g, ' ').trim();
  if (/[぀-ヿ㐀-鿿가-힯]/.test(text)) return null;
  const letters = text.match(/\p{L}/gu) ?? [];
  const cyrillic = text.match(/[а-яё]/giu) ?? [];
  if (letters.length < 15 || cyrillic.length / letters.length < .8) return null;
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
  text = sentences.slice(0, 4).join(' ').trim();
  if (anchor && !sharesMeaning(text, anchor)) return null;
  if (player && echoesPlayer(text, player, anchor)) return null;
  return text.length > 650 ? `${text.slice(0, 647).replace(/\s+\S*$/, '')}…` : text;
}

// ---------- engine lifecycle ----------

function readEnabled() { try { return localStorage.getItem(ENABLED_KEY) === 'true'; } catch { return false; } }

/** Detects WebGPU (and f16 shaders) and picks the matching model build. Safe to call repeatedly. */
export async function initLocalAi() {
  const state = useLocalAi.getState();
  if (state.status !== 'checking') return;
  const enabled = readEnabled();
  const gpu = typeof navigator !== 'undefined' ? (navigator as Navigator & { gpu?: { requestAdapter: () => Promise<{ features: Set<string>; info?: { vendor?: string } } | null> } }).gpu : undefined;
  const adapter = gpu ? await gpu.requestAdapter().catch(() => null) : null;
  if (!adapter) { useLocalAi.setState({ status: 'unsupported', enabled }); return; }
  const f16 = adapter.features.has('shader-f16');
  const tier: LocalModelTier = (() => { try { return localStorage.getItem(TIER_KEY) === 'light' ? 'light' : 'quality'; } catch { return 'quality'; } })();
  const model = modelFor(tier, f16);
  let cached = false;
  try { const webllm = await import('@mlc-ai/web-llm'); cached = await webllm.hasModelInCache(model); } catch { cached = false; }
  useLocalAi.setState({ status: 'idle', enabled, tier, f16, model, cached, gpu: adapter.info?.vendor ?? '' });
  // A model already in the browser cache starts without network traffic.
  if (enabled && cached) void loadLocalModel();
}

/** Switches between the quality and the light model; the other model stays cached. */
export async function setLocalModelTier(tier: LocalModelTier) {
  const state = useLocalAi.getState();
  if (state.tier === tier || state.status === 'loading' || state.status === 'unsupported' || state.status === 'checking') return;
  try { localStorage.setItem(TIER_KEY, tier); } catch { /* keep in memory */ }
  try { await engine?.unload(); } catch { /* already gone */ }
  engine = null;
  const model = modelFor(tier, state.f16);
  let cached = false;
  try { const webllm = await import('@mlc-ai/web-llm'); cached = await webllm.hasModelInCache(model); } catch { cached = false; }
  useLocalAi.setState({ tier, model, cached, status: 'idle', progress: 0, stage: '' });
  if (state.enabled && cached) void loadLocalModel();
}

export function setLocalAiEnabled(enabled: boolean) {
  try { localStorage.setItem(ENABLED_KEY, String(enabled)); } catch { /* private mode: keep it in memory */ }
  useLocalAi.setState({ enabled });
  if (enabled && useLocalAi.getState().cached) void loadLocalModel();
}

/** Downloads (first time) and initialises the model in a Web Worker, reporting progress 0–100%. */
export function loadLocalModel() {
  const state = useLocalAi.getState();
  if (engine || state.status === 'unsupported' || state.status === 'checking') return loading ?? Promise.resolve();
  loading ??= (async () => {
    useLocalAi.setState({ status: 'loading', progress: 0, stage: 'Подготовка WebGPU…', error: '' });
    try {
      const webllm = await import('@mlc-ai/web-llm');
      const worker = new Worker(new URL('./web-llm.worker.ts', import.meta.url), { type: 'module' });
      engine = await webllm.CreateWebWorkerMLCEngine(worker, state.model, {
        initProgressCallback: (report: InitProgressReport) => useLocalAi.setState({ progress: Math.round(report.progress * 100), stage: report.text }),
      });
      useLocalAi.setState({ status: 'ready', progress: 100, cached: true, stage: 'Модель готова' });
    } catch (error) {
      engine = null;
      useLocalAi.setState({ status: 'error', error: error instanceof Error ? error.message : String(error) });
    } finally {
      loading = null;
    }
  })();
  return loading;
}

export async function removeLocalModel() {
  const { model } = useLocalAi.getState();
  try { await engine?.unload(); } catch { /* already gone */ }
  engine = null;
  try { const webllm = await import('@mlc-ai/web-llm'); await webllm.deleteModelAllInfoInCache(model); } catch { /* cache unavailable */ }
  useLocalAi.setState({ status: 'idle', cached: false, progress: 0, stage: '' });
}

export function localAiReady() { const state = useLocalAi.getState(); return state.enabled && state.status === 'ready' && engine !== null; }
export function interruptLocalGeneration() { try { engine?.interruptGenerate(); } catch { /* nothing to stop */ } }

/**
 * Opponent reply from the on-device model. Never throws: without WebGPU, before the model is loaded,
 * on a timeout or an unusable answer it returns the scenario engine's reply.
 */
export async function generateOpponentReplyWebLLM(config: Config, turns: Turn[], choice: Choice, stage: number): Promise<{ text: string; source: 'webllm' | 'script'; fallback: boolean }> {
  const anchor = respond(config, stage, choice, outcome(config, [...turns, { ...choice, reply: '' }]).trust);
  const scripted = { text: anchor, source: 'script' as const, fallback: false };
  if (!localAiReady() || needsScriptedReply(choice) || validateLocalContext(config, turns, choice, stage)) return scripted;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const completion = engine!.chat.completions.create({ messages: buildLocalPrompt(config, turns, choice, stage), max_tokens: 160, temperature: .6, top_p: .9 });
    const timeout = new Promise<never>((_, reject) => { timer = setTimeout(() => { interruptLocalGeneration(); reject(new Error('timeout')); }, GENERATION_TIMEOUT_MS); });
    const response = await Promise.race([completion, timeout]);
    const raw = response.choices[0]?.message?.content ?? '';
    const text = sanitizeLocalReply(raw, anchor, choice.text);
    if (!text) console.debug('[arena] local model reply rejected:', raw);
    return text ? { text, source: 'webllm', fallback: false } : { ...scripted, fallback: true };
  } catch {
    return { ...scripted, fallback: true };
  } finally {
    if (timer) clearTimeout(timer);
  }
}
