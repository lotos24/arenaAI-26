import type { Config, CustomInterest, CustomScenario, Domain } from './engine';

export type ScenarioPreset = { id: string; title: string; description: string; config: Config; partner?: string };

/** Industry cases of the hackathon customer, SEZ «Alabuga»: own brief, opening line, frame and hidden interests. */
const ALABUGA_INVESTMENT: Config = {
  domain: 'supplier', tone: 'Жёсткий', difficulty: 'Эксперт',
  topic: 'Условия входа резидента и аренда производственного корпуса «Синергия»',
  role: 'Директор по работе с резидентами ОЭЗ «Алабуга»',
  goal: 'Защитить гарантии ввода мощностей, сохранить ставки инфраструктурного сбора и утвердить график запуска завода',
  custom: {
    person: 'Ильдар Сафин',
    brief: 'Вы представляете инвестора, который выбирает площадку для нового завода. ОЭЗ «Алабуга» предлагает производственный корпус «Синергия», но условия входа резидента жёсткие: гарантии ввода мощностей, инфраструктурный сбор и утверждённый график запуска. Ваша цель — войти на условиях, которые проект выдержит, и получить гибкий график первой очереди. Альтернатива: площадка в соседнем регионе с более мягкими условиями, но без готовой инфраструктуры.',
    opening: 'Корпус «Синергия» востребован, и условия для резидентов у нас едины: гарантии ввода мощностей, инфраструктурный сбор и утверждённый график запуска. Что вы готовы подтвердить?',
    frame: {
      goal: 'Стать резидентом на условиях, которые проект выдержит: гибкий график первой очереди и понятные ставки.',
      batna: 'Альтернативная площадка в соседнем регионе: условия мягче, но инфраструктуру придётся строить самим.',
      zopa: 'Между минимальными гарантиями, которые требует ОЭЗ, и условиями альтернативной площадки с учётом затрат на собственную инфраструктуру.',
    },
    interests: [
      { id: 'first-stage', label: 'Объём инвестиций первой очереди', hint: 'Спросите, какой объём первой очереди важен для зоны, и предложите его зафиксировать.', keywords: ['инвестиц', 'первой очеред', 'первая очередь', 'капвложен', 'объем вложен'], reveal: 'Для нас ключевой показатель — объём инвестиций первой очереди: под него мы планируем инфраструктуру и льготы.' },
      { id: 'power', label: 'Стабильное техприсоединение на 15 МВт', hint: 'Обсудите энергомощности и график нагрузки.', keywords: ['техприсоедин', 'мвт', 'мощност', 'энерг', 'подстанц', 'электр'], reveal: 'Техприсоединение на 15 МВт мы можем гарантировать, но только под утверждённый график нагрузки.' },
      { id: 'localization', label: 'Локализация поставщиков', hint: 'Предложите закупать у поставщиков региона или зоны.', keywords: ['локализ', 'местн', 'поставщик', 'кооперац', 'региональн'], reveal: 'Локализация поставщиков — приоритет зоны: за неё мы готовы обсуждать ставки инфраструктурного сбора.' },
    ],
  },
};
const ALABUGA_POLYTECH: Config = {
  domain: 'career', tone: 'Сдержанный', difficulty: 'Продвинутый',
  topic: 'Контракт с главным инженером роботизированных линий',
  role: 'Руководитель образовательного кластера «Алабуга Политех»',
  goal: 'Привлечь эксперта с реального производства для практического наставничества студентов на промышленных роботах',
  custom: {
    person: 'Алина Хасанова',
    brief: 'Вы — главный инженер роботизированных линий на действующем производстве. «Алабуга Политех» приглашает вас наставником студентов на промышленных роботах. Вам важны достойные условия, свобода в построении практики и понятная нагрузка. Альтернатива: остаться на производстве с текущим контрактом.',
    opening: 'Нам нужен практик, а не лектор: студенты должны работать на настоящих роботах. Давайте обсудим, на каких условиях вы готовы к нам прийти.',
    frame: {
      goal: 'Контракт наставника с достойной оплатой, жильём и свободой в программе практики.',
      batna: 'Остаться главным инженером на текущем производстве с прежним контрактом.',
      zopa: 'Между вашим текущим доходом на производстве и бюджетом кластера на наставников, с учётом жилья и нагрузки.',
    },
    interests: [
      { id: 'housing', label: 'Служебное жильё в Елабуге', hint: 'Спросите о переезде и жилье.', keywords: ['жиль', 'квартир', 'общежит', 'переезд', 'елабуг'], reveal: 'Служебное жильё в Елабуге мы можем предоставить: для наставников с производства это часть пакета.' },
      { id: 'freedom', label: 'Авторская свобода в программе обучения', hint: 'Предложите свою программу практики.', keywords: ['программ', 'автор', 'методик', 'свобод', 'свой курс'], reveal: 'Авторскую программу практики мы поддержим: нам важен результат, а не методичка.' },
      { id: 'employment', label: 'KPI по трудоустройству выпускников', hint: 'Спросите, как кластер измеряет успех наставника.', keywords: ['трудоустр', 'kpi', 'кпи', 'выпускник', 'показател'], reveal: 'Мой главный KPI — трудоустройство выпускников на заводы зоны. Если вы поможете его поднять, мы договоримся.' },
    ],
  },
};

/** Ready-made cases for the administrator: one click fills the whole constructor form. */
export const SCENARIO_PRESETS: ScenarioPreset[] = [
  { id: 'alabuga-investment', partner: 'ОЭЗ «Алабуга»', title: 'Инвестиции: размещение завода в ОЭЗ «Алабуга»', description: 'Условия входа резидента и аренда корпуса «Синергия».', config: ALABUGA_INVESTMENT },
  { id: 'alabuga-polytech', partner: 'ОЭЗ «Алабуга»', title: 'Алабуга Политех: привлечение инженера-наставника', description: 'Контракт с главным инженером роботизированных линий.', config: ALABUGA_POLYTECH },
  { id: 'raw-materials', title: 'Закупки: рост цен сырья на 15%', description: 'Поставщик сырья поднимает цены. Удержите бюджет и отношения.',
    config: { domain: 'supplier', tone: 'Сдержанный', difficulty: 'Продвинутый', topic: 'Рост цен на сырьё на 15%', role: 'Директор по продажам поставщика сырья', goal: 'Переложить рост себестоимости на покупателя и сохранить объём' } },
  { id: 'grade', title: 'Карьера: защита грейда и зарплаты', description: 'Обоснуйте переход на следующий грейд своими результатами.',
    config: { domain: 'career', tone: 'Дружелюбный', difficulty: 'Базовый', topic: 'Переход на следующий грейд и пересмотр зарплаты', role: 'Руководитель отдела', goal: 'Сохранить фонд оплаты труда и мотивацию сотрудника' } },
  { id: 'hot-release', title: 'IT-проект: горящий релиз клиента', description: 'Клиент сдвинул срок. Договоритесь с ведущим разработчиком.',
    config: { domain: 'team', tone: 'Жёсткий', difficulty: 'Эксперт', topic: 'Горящий релиз для ключевого клиента', role: 'Ведущий разработчик', goal: 'Не допустить переработок и выпуска сырого релиза' } },
  { id: 'b2b-discount', title: 'B2B-продажи: требование скидки 25%', description: 'Жёсткий торг о цене контракта: реплики строятся по вашей теме.',
    config: { domain: 'supplier', tone: 'Жёсткий', difficulty: 'Продвинутый', topic: 'Требование скидки 25% при продлении контракта', role: 'Коммерческий директор', goal: 'Сохранить маржу и не отдать скидку без встречных обязательств' } },
  { id: 'counteroffer', title: 'HR: удержание тимлида при контроффере', description: 'У тимлида оффер конкурента. Найдите условия, при которых он останется.',
    config: { domain: 'career', tone: 'Сдержанный', difficulty: 'Продвинутый', topic: 'Удержание тимлида с оффером от конкурента', role: 'Руководитель направления', goal: 'Удержать тимлида, не выходя за вилку грейда' } },
];

const DOMAINS: Domain[] = ['supplier', 'career', 'team'];
const DIFFICULTIES: Config['difficulty'][] = ['Базовый', 'Продвинутый', 'Эксперт'];
const TONES: Config['tone'][] = ['Дружелюбный', 'Сдержанный', 'Жёсткий'];
const LIMITS = { topic: 100, role: 80, goal: 180 } as const;

export function sameScenario(a: Config, b: Config) {
  return a.domain === b.domain && a.difficulty === b.difficulty && a.tone === b.tone && a.topic === b.topic && a.role === b.role && a.goal === b.goal
    && JSON.stringify(a.custom ?? null) === JSON.stringify(b.custom ?? null);
}

export function serializeScenario(config: Config) {
  const { domain, topic, difficulty, tone, role, goal, custom } = config;
  return JSON.stringify({ format: 'arena-scenario', version: 2, config: { domain, topic, difficulty, tone, role, goal, ...(custom ? { custom } : {}) } }, null, 2);
}

const optionalText = (value: unknown, limit: number, field: string) => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') throw new Error(`Поле «${field}» должно быть строкой.`);
  return value.trim().slice(0, limit) || undefined;
};

/** Validates the extended part of a scenario: persona, texts, frame and hidden interests with keywords. */
function parseCustom(raw: unknown): CustomScenario | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw !== 'object') throw new Error('Блок «custom» должен быть объектом.');
  const value = raw as Record<string, unknown>;
  const custom: CustomScenario = {};
  const person = optionalText(value.person, 60, 'custom.person'); if (person) custom.person = person;
  const brief = optionalText(value.brief, 700, 'custom.brief'); if (brief) custom.brief = brief;
  const opening = optionalText(value.opening, 300, 'custom.opening'); if (opening) custom.opening = opening;
  if (value.frame !== undefined) {
    const frame = value.frame as Record<string, unknown> | null;
    const goal = optionalText(frame?.goal, 300, 'custom.frame.goal'), batna = optionalText(frame?.batna, 300, 'custom.frame.batna'), zopa = optionalText(frame?.zopa, 300, 'custom.frame.zopa');
    if (!goal || !batna || !zopa) throw new Error('В «custom.frame» нужны goal, batna и zopa.');
    custom.frame = { goal, batna, zopa };
  }
  if (value.interests !== undefined) {
    if (!Array.isArray(value.interests) || value.interests.length > 5) throw new Error('«custom.interests» — массив не длиннее 5 интересов.');
    custom.interests = value.interests.map((item, index): CustomInterest => {
      const entry = (item ?? {}) as Record<string, unknown>;
      const label = optionalText(entry.label, 90, `interests[${index}].label`);
      const reveal = optionalText(entry.reveal, 300, `interests[${index}].reveal`);
      const keywords = Array.isArray(entry.keywords) ? entry.keywords.filter((word): word is string => typeof word === 'string' && Boolean(word.trim())).map(word => word.trim().slice(0, 30)).slice(0, 12) : [];
      if (!label || !reveal || !keywords.length) throw new Error(`У интереса №${index + 1} нужны label, reveal и хотя бы одно ключевое слово.`);
      return { id: optionalText(entry.id, 40, `interests[${index}].id`) ?? `interest-${index + 1}`, label, hint: optionalText(entry.hint, 160, `interests[${index}].hint`) ?? 'Спросите о том, что стоит за позицией собеседника.', keywords, reveal };
    });
  }
  return Object.keys(custom).length ? custom : undefined;
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
  const custom = parseCustom(raw.custom);
  return { domain: raw.domain as Domain, difficulty: raw.difficulty as Config['difficulty'], tone: raw.tone as Config['tone'], topic: text$('topic'), role: text$('role'), goal: text$('goal'), ...(custom ? { custom } : {}) };
}
