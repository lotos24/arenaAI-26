import type { Config, Domain } from './engine';

export type ScenarioPreset = { id: string; title: string; description: string; config: Config };

/** Ready-made cases for the administrator: one click fills the whole constructor form. */
export const SCENARIO_PRESETS: ScenarioPreset[] = [
  { id: 'raw-materials', title: 'Закупки: рост цен сырья на 15%', description: 'Поставщик сырья поднимает цены. Удержите бюджет и отношения.',
    config: { domain: 'supplier', tone: 'Сдержанный', difficulty: 'Продвинутый', topic: 'Рост цен на сырьё на 15%', role: 'Директор по продажам поставщика сырья', goal: 'Переложить рост себестоимости на покупателя и сохранить объём' } },
  { id: 'grade', title: 'Карьера: защита грейда и зарплаты', description: 'Обоснуйте переход на следующий грейд своими результатами.',
    config: { domain: 'career', tone: 'Дружелюбный', difficulty: 'Базовый', topic: 'Переход на следующий грейд и пересмотр зарплаты', role: 'Руководитель отдела', goal: 'Сохранить фонд оплаты труда и мотивацию сотрудника' } },
  { id: 'hot-release', title: 'IT-проект: горящий релиз клиента', description: 'Клиент сдвинул срок. Договоритесь с ведущим разработчиком.',
    config: { domain: 'team', tone: 'Жёсткий', difficulty: 'Эксперт', topic: 'Горящий релиз для ключевого клиента', role: 'Ведущий разработчик', goal: 'Не допустить переработок и выпуска сырого релиза' } },
  { id: 'b2b-discount', title: 'B2B-продажи: требование скидки 25%', description: 'Жёсткий торг о цене контракта. Реплики — из сюжета «Закупки».',
    config: { domain: 'supplier', tone: 'Жёсткий', difficulty: 'Продвинутый', topic: 'Требование скидки 25% при продлении контракта', role: 'Коммерческий директор', goal: 'Сохранить маржу и не отдать скидку без встречных обязательств' } },
  { id: 'counteroffer', title: 'HR: удержание тимлида при контроффере', description: 'У тимлида оффер конкурента. Найдите условия, при которых он останется.',
    config: { domain: 'career', tone: 'Сдержанный', difficulty: 'Продвинутый', topic: 'Удержание тимлида с оффером от конкурента', role: 'Руководитель направления', goal: 'Удержать тимлида, не выходя за вилку грейда' } },
];

const DOMAINS: Domain[] = ['supplier', 'career', 'team'];
const DIFFICULTIES: Config['difficulty'][] = ['Базовый', 'Продвинутый', 'Эксперт'];
const TONES: Config['tone'][] = ['Дружелюбный', 'Сдержанный', 'Жёсткий'];
const LIMITS = { topic: 100, role: 80, goal: 180 } as const;

export function sameScenario(a: Config, b: Config) {
  return a.domain === b.domain && a.difficulty === b.difficulty && a.tone === b.tone && a.topic === b.topic && a.role === b.role && a.goal === b.goal;
}

export function serializeScenario(config: Config) {
  const { domain, topic, difficulty, tone, role, goal } = config;
  return JSON.stringify({ format: 'arena-scenario', version: 1, config: { domain, topic, difficulty, tone, role, goal } }, null, 2);
}

/** Accepts an exported scenario (or a bare config object) and validates every field. */
export function parseScenario(text: string): Config {
  let value: unknown;
  try { value = JSON.parse(text.trim()); } catch { throw new Error('Это не JSON. Вставьте текст, скопированный кнопкой «Экспорт сценария».'); }
  const raw = (value && typeof value === 'object' && 'config' in value ? (value as { config: unknown }).config : value) as Partial<Record<keyof Config, unknown>> | null;
  if (!raw || typeof raw !== 'object') throw new Error('В JSON нет настроек сценария.');
  if (!DOMAINS.includes(raw.domain as Domain)) throw new Error('Неизвестная сфера. Допустимо: supplier, career, team.');
  if (!DIFFICULTIES.includes(raw.difficulty as Config['difficulty'])) throw new Error('Неизвестная сложность. Допустимо: Базовый, Продвинутый, Эксперт.');
  if (!TONES.includes(raw.tone as Config['tone'])) throw new Error('Неизвестный тон. Допустимо: Дружелюбный, Сдержанный, Жёсткий.');
  const text$ = (key: keyof typeof LIMITS) => {
    const field = raw[key];
    if (typeof field !== 'string' || !field.trim()) throw new Error(`Заполните поле «${{ topic: 'Тема', role: 'Роль', goal: 'Цель' }[key]}».`);
    return field.trim().slice(0, LIMITS[key]);
  };
  return { domain: raw.domain as Domain, difficulty: raw.difficulty as Config['difficulty'], tone: raw.tone as Config['tone'], topic: text$('topic'), role: text$('role'), goal: text$('goal') };
}
