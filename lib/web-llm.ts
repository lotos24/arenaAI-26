import { create } from 'zustand';
import type { InitProgressReport, MLCEngineInterface } from '@mlc-ai/web-llm';
import { AI_CREDIT_LIMIT, Choice, Config, GAP_CRITERIA, GapId, interestsFor, outcome, personaGender, respond, scenarioFor, SESSION_STAGE_COUNT, stages, tension, Turn } from './engine';

export { personaGender };

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
const ASSESSMENT_TIMEOUT_MS = 15_000;

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
  const asked = choice.cues?.some(cue => cue === 'question' || cue === 'interestQuestion' || cue === 'checkQuestion');
  // The scenario reply already answers the player's words (question, figure, offer); the model voices it in its own
  // words. Asked to answer freely, the 1.5B model swapped roles and reversed agreements, so the gist stays fixed.
  // The task comes last, after the gist, because small models copy whatever line stands right before it.
  return [
    { role: 'system', content: [
      `Ты — ${clip(scenario.person, 60)}, ${clip(config.role.toLowerCase(), 120)}. Идут деловые переговоры на тему «${clip(config.topic, 120)}». Говори о себе в ${female ? 'женском' : 'мужском'} роде и обращайся к собеседнику на «вы».`,
      `Твоя цель: ${clip(config.goal, 200)}. Тон: ${config.tone.toLowerCase()}. Сейчас ${mood}.`,
      'Отвечай только по-русски, от первого лица, 2–3 коротких предложения живой деловой речи. Без списков, без кавычек, без пояснений в скобках.',
      'Не упоминай, что ты модель, программа или симуляция. Не соглашайся с тем, что игрок ещё не предложил, и не повторяй его слова.',
      `${clip(scenario.person.split(/\s+/)[0] ?? '', 30)} — это ты: не называй собеседника этим именем. Говори о своих интересах от первого лица и не расспрашивай собеседника о них.`,
    ].join(' ') },
    { role: 'user', content: [
      history ? `Ход разговора:\n${history}` : `Ты начал разговор словами: ${clip(scenario.opening, 300)}`,
      `Этап: ${stages[stage]}. Собеседник только что сказал тебе: «${clip(choice.text, 220)}»`,
      asked ? 'Он задал вопрос — ответ на него уже есть в сути ниже.' : choice.figure ? `Он назвал цифру «${clip(choice.figure, 40)}» — реакция на неё уже есть в сути ниже.` : '',
      touched.length ? `Собеседник затронул твой скрытый интерес (${touched.join('; ')}) — признай это.` : '',
      `Суть твоего ответа: «${clip(anchor)}»`,
      'Скажи эту суть своими словами живой речью, 2–4 коротких предложения. Не меняй смысл: не добавляй согласий, отказов, цифр и вопросов, которых в ней нет. Не повторяй фразы собеседника. Выведи только текст реплики.',
    ].filter(Boolean).join('\n\n') },
  ];
}

/** Messages for the second assessor: it checks only the elements the keyword score did not find. */
export function buildAssessmentPrompt(choice: Choice, stage: number): LocalMessage[] {
  const gaps = choice.gaps ?? [];
  return [
    { role: 'system', content: 'Ты — строгий эксперт по деловым переговорам. Ты проверяешь реплику участника по критериям и отвечаешь только в заданном формате, без пояснений.' },
    { role: 'user', content: [
      `Этап переговоров: ${stages[Math.max(0, Math.min(stage, SESSION_STAGE_COUNT - 1))]}.`,
      `Реплика участника: «${clip(choice.text, 500)}»`,
      `Критерии:\n${gaps.map((gap, index) => `${index + 1}. Участник ${GAP_CRITERIA[gap]}.`).join('\n')}`,
      'Для каждого критерия, который в реплике действительно выполнен, выведи отдельную строку из номера критерия и точной цитаты из реплики в кавычках-ёлочках, например: 2: «слова участника». Если ни один критерий не выполнен, выведи одно слово: нет. Не придумывай цитаты и не засчитывай то, чего в реплике нет.',
    ].join('\n\n') },
  ];
}
const TERM = /срок|время|дат|объ[её]м|ресурс|цен|стоимост|график|люд|команд|бюджет|качеств|оплат|аренд|мощност|инвестиц|зарплат|kpi|роль|задач/gu;
const countTerms = (text: string) => new Set(text.match(TERM) ?? []).size;
/**
 * The model proposes, a lenient rule confirms: a credited quote must at least look like its criterion
 * (a question for a question, two parameters for «several parameters»), so a small model cannot credit anything with any quote.
 */
const PLAUSIBLE: Record<GapId, (quote: string) => boolean> = {
  acknowledge: q => /понима|вижу|слышу|знаю|ясно|уважа|непрост|сложн|близк|разделя|ценю|поддерживаю|ваша идея|ваш подход|ваш\S* (?:ситуац|положен|задач|огранич)/u.test(q),
  together: q => /вместе|совместн|сообща|найд[её]м|обе сторон|обеих|друг другу|партн/u.test(q),
  common: q => /общ|обоих|обеих|обе сторон|оба|вместе|долгосроч|отношени|сотрудн|выигра|польз/u.test(q),
  positions: q => /(?:^| )(?:вам|вы|ваш\S*)(?= |$)/u.test(q) && /(?:^| )(?:нам|мы|наш\S*|мне|я)(?= |$)/u.test(q),
  check: q => /верно|правильно|так ли|уловил|понял|понимаю ли|сверим|одинаково/u.test(q),
  boundary: q => /не (?:больше|дороже|выше|меньше|ниже|раньше|позже)|предел|максимум|минимум|границ|не можем|не готов|только если|до \d/u.test(q),
  openQuestion: q => /хочу понять|интересно|расскажите|поделитесь|объясните|почему|зачем|связан|держится|стоит за|что для вас|как вы/u.test(q),
  axes: q => countTerms(q) >= 2,
  proposal: q => /предлага|готов|можем|давайте|возьм|сделаем|вариант|берём|берем/u.test(q),
  terms: q => countTerms(q) >= 2 || (q.match(/\d+/g) ?? []).length >= 2,
  exchange: q => /взамен|в обмен|за это|со своей стороны|с нашей стороны|обеспечим|гарантируем|дадим|возьм[её]м на себя|а (?:мы|я) /u.test(q),
  objection: q => /риск|опаса|беспоко|сомнева|страх|боит|волну|пережива/u.test(q),
  mitigation: q => /пилот|гарант|страхов|контрол|провер|поэтап|сниз|защит|подстрах|компенс/u.test(q),
  contingency: q => /если|в случае|при условии|при отклонен|пересмотр|по итогам|контрольн|через \S+ (?:месяц|недел|квартал)/u.test(q),
  summary: q => /итак|итог|договорились|фиксир|резюм|подвед|получается/u.test(q),
  owner: q => /(?:отправ|подготов|пришл|пришлю|сделаю|возьм|ответствен)/u.test(q) && /(?:до |к |сегодня|завтра|понедел|вторн|сред|четверг|пятниц|недел|\d)/u.test(q),
  written: q => /письм|протокол|документ|почт|подтверд|согласны/u.test(q),
};
const normalizeQuote = (text: string) => text.toLowerCase().replace(/ё/g, 'е').replace(/[«»"“”„.,!?;:—–-]/g, ' ').replace(/\s+/g, ' ').trim();
/**
 * Reads «номер: «цитата»» lines. A credit counts only when its quote really occurs in the player's words and
 * has at least two words; one quote cannot back two criteria, and no more than AI_CREDIT_LIMIT are taken.
 */
export function parseAssessment(raw: string, choice: Choice): { gap: GapId; quote: string }[] {
  const gaps = choice.gaps ?? [];
  const said = normalizeQuote(choice.text);
  const found: { gap: GapId; quote: string }[] = [];
  const used = new Set<string>();
  for (const line of raw.split(/\n+/)) {
    // «2: «цитата»», «2. «цитата»» and the literal «2. номер: «цитата»» small models write.
    const match = line.match(/^\s*(\d+)\s*[:.)\-–—]?[^«"“„\d]{0,20}[«"“„]([^»"”]+)[»"”]/u);
    if (!match) continue;
    const named = gaps[Number(match[1]) - 1];
    const quote = match[2].trim().replace(/[.,;:]+$/u, '');
    const key = normalizeQuote(quote);
    if (!named || key.split(' ').length < 2 || !said.includes(key) || used.has(key)) continue;
    // Small models mix up the numbers: a real quote goes to the missing criterion it actually fits.
    const open = gaps.filter(item => !found.some(credit => credit.gap === item));
    const gap = PLAUSIBLE[named](key) && open.includes(named) ? named : open.find(item => PLAUSIBLE[item](key));
    if (!gap) continue;
    used.add(key);
    found.push({ gap, quote });
    if (found.length >= AI_CREDIT_LIMIT) break;
  }
  return found;
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const STOP_STEMS =new Set(['котор', 'также', 'между', 'чтобы', 'может', 'будет', 'очень', 'давай', 'нужно', 'важно', 'можно', 'сейча', 'этого', 'этому', 'всего']);
const stemsOf = (text: string) => new Set((text.toLowerCase().replace(/ё/g, 'е').match(/[а-я]{5,}/g) ?? []).map(word => word.slice(0, 5)).filter(stem => !STOP_STEMS.has(stem)));
/**
 * A reply must share meaning with the scripted anchor: small models otherwise drift or swap roles.
 * One shared word is enough when the reply also picks up the player's own words, i.e. it answers them.
 */
export function sharesMeaning(reply: string, anchor: string, player = '') {
  const expected = stemsOf(anchor);
  const own = stemsOf(reply);
  let shared = 0;
  for (const stem of own) if (expected.has(stem)) shared++;
  if (shared >= 2) return true;
  const theirs = stemsOf(player);
  return shared >= 1 && [...own].some(stem => theirs.has(stem) && !expected.has(stem));
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
  if (own.size > 0 && copied / own.size >= .6) return true;
  // Five of the player's words in a row, not taken from the gist: the model speaks the player's line as its own.
  const words = (text: string) => text.toLowerCase().replace(/ё/g, 'е').match(/[а-яa-z0-9]+/g) ?? [];
  const said = words(player);
  const replyText = ` ${words(reply).join(' ')} `;
  const gistText = ` ${words(anchor).join(' ')} `;
  for (let i = 0; i + 5 <= said.length; i++) {
    const run = ` ${said.slice(i, i + 5).join(' ')} `;
    if (replyText.includes(run) && !gistText.includes(run)) return true;
  }
  return false;
}
/**
 * A small model answering freely sometimes speaks for the player: it calls the persona by name
 * («Хорошо, Алина») or turns the opponent's own statement into a question about «ваш» interest.
 */
export function swapsRoles(reply: string, anchor: string, person: string) {
  const name = (person.trim().split(/\s+/)[0] ?? '').toLowerCase().replace(/ё/g, 'е');
  const text = reply.toLowerCase().replace(/ё/g, 'е');
  if (name.length >= 3 && new RegExp(`(?<![\\p{L}])${escapeRegExp(name.slice(0, Math.max(3, name.length - 1)))}\\p{L}{0,3}(?![\\p{L}])`, 'u').test(text)) return true;
  if (anchor.includes('?')) return false;
  const questions = text.match(/[^.!?]*\?/g) ?? [];
  return questions.some(question => /(?<![\p{L}])(?:вас|вам|ваш\p{L}*)(?![\p{L}])/u.test(question));
}
const REFUSAL = /(?<![\p{L}])(?:не готов\p{L}*|не могу|не можем|не соглас\p{L}*|пересмотрим (?:этот|эти|данный) пункт\p{L}*|откаж\p{L}*|отказ\p{L}*|против)(?![\p{L}])/u;
const AGREEMENT = /(?<![\p{L}])(?:договорились|зафиксируем|согласен|согласна|согласны|принимаю|поддержим|можем предоставить|снимает)(?![\p{L}])/u;
/** An agreeing gist must not come back as a refusal («давайте пересмотрим этот пункт» instead of «так и зафиксируем»). */
export function reversesStance(reply: string, anchor: string) {
  const gist = anchor.toLowerCase().replace(/ё/g, 'е');
  const text = reply.toLowerCase().replace(/ё/g, 'е');
  return AGREEMENT.test(gist) && !REFUSAL.test(gist) && REFUSAL.test(text);
}
/**
 * Conflict moves keep their deterministic reply: small models tend to agree with ultimatums.
 * A weak or clumsy free-text move still goes to the model, so the opponent answers the player's own words.
 */
export function needsScriptedReply(choice: Choice) {
  if (choice.freeText) return ['insult', 'threat', 'demand', 'silence'].includes(choice.intent ?? '');
  return choice.trust < 0 || ['insult', 'threat', 'demand', 'silence', 'vague'].includes(choice.intent ?? '');
}

/** Cleans a model answer; returns null when it is unusable (wrong script, empty, too short, off the anchor's meaning, swapped roles). */
export function sanitizeLocalReply(raw: string, anchor?: string, player?: string, person?: string) {
  let text = raw.replace(/\*\*|__|`/g, '').replace(/^\s*(?:вот\s+)?(?:пример\s+)?(?:мой\s+)?(?:ответ\p{L}*|реплик\p{L}*)\s*:\s*/iu, '').replace(/^\s*(?:ты|собеседник|ответ|[А-ЯЁA-Z][а-яёa-z]+(?: [А-ЯЁA-Z][а-яёa-z]+)?)\s*:\s*/u, '').replace(/^["«„]+|["»“]+$/g, '').replace(/\s+/g, ' ').trim();
  if (/пример ответа|как языков|я —? ?(?:ии|модел)/iu.test(text)) return null;
  // «Нам нужна скидка. Ты: Скажу прямо…» — the model replayed the dialogue; only the part after the last role mark is the reply.
  const marks = [...text.matchAll(/(?:^|\s)(?:Ты|Собеседник|Ответ)\s*:\s*/gu)];
  if (marks.length) { const last = marks[marks.length - 1]; text = text.slice(last.index! + last[0].length).trim(); }
  if (/[぀-ヿ㐀-鿿가-힯]/.test(text)) return null;
  const letters = text.match(/\p{L}/gu) ?? [];
  const cyrillic = text.match(/[а-яё]/giu) ?? [];
  if (letters.length < 15 || cyrillic.length / letters.length < .8) return null;
  // «Здравствуйте, Алина» from Алина herself: the model echoed the player's greeting, the rest of the reply may be fine.
  const first = person?.trim().split(/\s+/)[0];
  const name = first ? escapeRegExp(first) : '';
  if (name) text = text.replace(new RegExp(`,\\s*${name}(?=[.!?,])|^${name},\\s*`, 'gu'), '').replace(/^\p{Ll}/u, letter => letter.toUpperCase());
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
  text = sentences.slice(0, 4).map(sentence => sentence.trim()).join(' ');
  if (anchor && !sharesMeaning(text, anchor, player)) return null;
  // A retelling much longer than the gist has wandered off: the 1.5B model starts guessing the player's motives.
  if (anchor && text.length > anchor.length * 1.8 + 60) return null;
  if (player && echoesPlayer(text, player, anchor)) return null;
  if (person && swapsRoles(text, anchor ?? '', person)) return null;
  if (anchor && reversesStance(text, anchor)) return null;
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
/**
 * WebLLM keeps an interrupt raised while idle, and every later non-streaming request then returns an empty reply.
 * So only a running generation is interrupted (leaving the arena mid-reply or on the timeout).
 */
let generating = false;
export function interruptLocalGeneration() { if (!generating) return; try { void engine?.interruptGenerate(); } catch { /* nothing to stop */ } }

/**
 * Opponent reply from the on-device model. Never throws: without WebGPU, before the model is loaded,
 * on a timeout or an unusable answer it returns the scenario engine's reply.
 */
/** Runs one streamed request on the loaded model; only this running request can be interrupted. */
async function runLocal(messages: LocalMessage[], maxTokens: number, temperature: number, timeoutMs: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  generating = true;
  try {
    // Streaming: WebLLM clears a stale interrupt at the start of a streamed request, so one bad interrupt cannot mute later replies.
    const collect = async () => {
      const chunks = await engine!.chat.completions.create({ messages, max_tokens: maxTokens, temperature, top_p: .9, stream: true });
      let raw = '';
      for await (const chunk of chunks) raw += chunk.choices[0]?.delta?.content ?? '';
      return raw;
    };
    const timeout = new Promise<never>((_, reject) => { timer = setTimeout(() => { interruptLocalGeneration(); reject(new Error('timeout')); }, timeoutMs); });
    return await Promise.race([collect(), timeout]);
  } finally {
    generating = false;
    if (timer) clearTimeout(timer);
  }
}

/**
 * Second opinion on a free-text move from the on-device model: which of the missing elements are there after all,
 * each backed by a quote. Returns nothing without a loaded model, for conflict moves, on a timeout or an unusable answer.
 */
export async function assessFreeTextWithLocalAi(choice: Choice, stage: number): Promise<{ gap: GapId; quote: string }[]> {
  if (!localAiReady() || !choice.freeText || !choice.gaps?.length || needsScriptedReply(choice)) return [];
  try {
    const raw = await runLocal(buildAssessmentPrompt(choice, stage), 120, .1, ASSESSMENT_TIMEOUT_MS);
    console.debug('[arena] local assessment:', raw);
    return parseAssessment(raw, choice);
  } catch {
    return [];
  }
}

export async function generateOpponentReplyWebLLM(config: Config, turns: Turn[], choice: Choice, stage: number): Promise<{ text: string; source: 'webllm' | 'script'; fallback: boolean }> {
  const anchor = respond(config, stage, choice, outcome(config, [...turns, { ...choice, reply: '' }]).trust);
  const scripted = { text: anchor, source: 'script' as const, fallback: false };
  if (!localAiReady() || needsScriptedReply(choice) || validateLocalContext(config, turns, choice, stage)) return scripted;
  try {
    const raw = await runLocal(buildLocalPrompt(config, turns, choice, stage), 160, .6, GENERATION_TIMEOUT_MS);
    const text = sanitizeLocalReply(raw, anchor, choice.text, scenarioFor(config).person);
    if (!text) console.debug('[arena] local model reply rejected:', raw);
    return text ? { text, source: 'webllm', fallback: false } : { ...scripted, fallback: true };
  } catch {
    return { ...scripted, fallback: true };
  }
}
