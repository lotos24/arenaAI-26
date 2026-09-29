export type Domain = 'supplier' | 'career' | 'team';
/** Hidden interest written by an administrator: keywords are word stems the player has to touch. */
export type CustomInterest = { id: string; label: string; hint: string; keywords: string[]; reveal: string };
/** Extended scenario from the constructor or an imported JSON: overrides the story texts of the domain. */
export type CustomScenario = { person?: string; brief?: string; opening?: string; frame?: { goal: string; batna: string; zopa: string }; interests?: CustomInterest[] };
export type Config = { domain: Domain; topic: string; difficulty: 'Базовый' | 'Продвинутый' | 'Эксперт'; tone: 'Сдержанный' | 'Дружелюбный' | 'Жёсткий'; role: string; goal: string; custom?: CustomScenario };
export type NegotiationIntent = 'scripted' | 'insult' | 'threat' | 'vague' | 'demand' | 'question' | 'proposal' | 'repair' | 'commitment' | 'silence';
export type TechniqueId = 'empathy' | 'spinSituation' | 'spinProblem' | 'harvardInterests' | 'harvardPackage' | 'harvardCriteria' | 'closing' | 'batna' | 'batnaThreat' | 'positional' | 'pressure' | 'concession' | 'vague';
/** What a free-text move contains, so the opponent can answer the words and not only the score. */
export type Cue = 'greeting' | 'interestQuestion' | 'checkQuestion' | 'question' | 'empathy' | 'proposal' | 'exchange' | 'concession';
/** The first thing a free-text move still lacks for its stage; the opponent asks for it in their own voice. */
export type GapId = 'acknowledge' | 'together' | 'common' | 'positions' | 'check' | 'boundary' | 'openQuestion' | 'axes' | 'proposal' | 'terms' | 'exchange' | 'objection' | 'mitigation' | 'contingency' | 'summary' | 'owner' | 'written';
export type Choice = { text: string; skill: string; points: number; trust: number; feedback: string; tension?: number; intent?: NegotiationIntent; interests?: string[]; freeText?: boolean; technique?: TechniqueId; timerLeft?: number; voice?: boolean; cues?: Cue[]; figure?: string; gaps?: GapId[]; hinted?: string; aiCredit?: { gap: GapId; quote: string }[] };
export type Turn = Choice & { reply: string };
export const defaults: Record<Domain, Config> = {
 supplier: { domain: 'supplier', topic: 'Цена долгосрочного контракта', difficulty: 'Продвинутый', tone: 'Сдержанный', role: 'Директор по продажам', goal: 'Сохранить маржу и получить гарантированный объём' },
 career: { domain: 'career', topic: 'Повышение и новая зона ответственности', difficulty: 'Базовый', tone: 'Дружелюбный', role: 'Руководитель команды', goal: 'Удержать сотрудника в рамках бюджета отдела' },
 team: { domain: 'team', topic: 'Срочный релиз без выгорания команды', difficulty: 'Продвинутый', tone: 'Сдержанный', role: 'Ведущий разработчик', goal: 'Защитить команду от переработок и сохранить качество' }
};
export const scenarios = {
 supplier: { title: 'По обе стороны сделки', label: 'Закупки и продажи', person: 'Александр Морозов', initials: 'АМ', description: 'Поставщик повышает цены на 15%. Сохраните бюджет и отношения, найдя решение для обеих сторон.', brief: 'Вы руководите закупками. Поставщик уведомил о повышении цены на 15%. Ваша цель — ограничить рост до 5%. Вы можете предложить контракт на год и гарантированный объём. Альтернатива: другой поставщик с ростом цены 8%, но переход займёт месяц.', opening: 'Мы вынуждены поднять цены на 15%. Издержки выросли, и прежние условия больше не работают.', frame: { goal: 'Ограничить рост цены до 5% и сохранить поставщика.', batna: 'Другой поставщик с ростом цены 8%, но переход займёт месяц.', zopa: 'Рост от 5% (ваша цель) до 8% (цена альтернативы). Условия хуже 8% выгоднее не принимать и переходить к альтернативе.' } },
 career: { title: 'Следующая ступень', label: 'Карьера и развитие', person: 'Анна Соколова', initials: 'АС', description: 'Вы готовы к большей роли. Обсудите повышение, опираясь на результаты и интересы команды.', brief: 'За полгода вы сократили сроки проектов на 20% и обучили двух коллег. Вы хотите повышение зарплаты на 15% и ведущую роль. Бюджет ограничен. Альтернатива: согласовать повышение через три месяца по измеримым результатам.', opening: 'Я ценю вашу работу, но бюджет на повышения сейчас ограничен. Что вы хотели бы предложить?', frame: { goal: 'Ведущая роль и повышение зарплаты на 15%.', batna: 'Согласовать повышение через три месяца по измеримым результатам.', zopa: 'От пересмотра через три месяца по KPI до +15% сейчас. Предложение хуже вашей альтернативы — повод не соглашаться.' } },
 team: { title: 'Сроки против выгорания', label: 'Команда и управление', person: 'Игорь Лебедев', initials: 'ИЛ', description: 'Клиент сдвинул релиз на две недели раньше. Договоритесь с ведущим разработчиком, не потеряв ни срок, ни команду.', brief: 'Вы руководите проектом. Клиент перенёс релиз на две недели раньше. Ведущий разработчик отказывается от переработок: команда устала после прошлого спринта. Ваша цель — сдать в срок хотя бы ключевую часть и не потерять ключевого сотрудника. Вы можете сократить объём, дать отгулы и подключить стажёра. Альтернатива: попросить клиента о поэтапной поставке.', opening: 'Сразу скажу: ещё один спринт с ночными сменами команда не выдержит. Я против нового срока.', frame: { goal: 'Сдать ключевую часть релиза в срок и не потерять ведущего разработчика.', batna: 'Попросить клиента о поэтапной поставке и сдвинуть вторую часть.', zopa: 'Ключевые функции к новому сроку без ночных смен. Весь объём к сроку лежит вне зоны: на это команда не согласится.' } }
};
const OPENING_LEAD: Record<Config['tone'], string> = { Дружелюбный: 'Хорошо, что нашли время встретиться. ', Сдержанный: '', Жёсткий: 'Времени у меня немного, так что коротко. ' };

/** Topics the hand-written stories of each domain were written for (default, map levels and fitting presets). */
export const STORY_TOPICS: Record<Domain, string[]> = {
 supplier: ['Цена долгосрочного контракта', 'Контракт с локальным поставщиком', 'Поставки для региональной сети', 'Условия федерального тендера', 'Международный контракт поставки', 'Рост цен на сырьё на 15%'],
 career: ['Повышение и новая зона ответственности', 'Повышение до ведущего специалиста', 'Переговоры с советом директоров', 'Переход на следующий грейд и пересмотр зарплаты', 'Удержание тимлида с оффером от конкурента'],
 team: ['Срочный релиз без выгорания команды', 'Срочный релиз для регионального клиента', 'Релиз федерального проекта', 'Горящий релиз для ключевого клиента'],
};
/** Hand-written story texts only fit their own topics; any other topic switches to templates with {topic}, {role} and {goal}. */
export function usesStory(config: Pick<Config, 'domain' | 'topic' | 'custom'>) {
 return !config.custom && STORY_TOPICS[config.domain].includes(config.topic.trim());
}
// Acronyms such as «KPI» or «ОЭЗ» keep their case inside a sentence.
const lowerFirst = (value: string) => !value || /^\p{Lu}{2}/u.test(value) ? value : value[0].toLowerCase() + value.slice(1);
const upperFirst = (value: string) => value ? value[0].toUpperCase() + value.slice(1) : value;
/** Fills {topic}, {role} and {goal} (lower-cased so it reads inside a sentence). */
export function fillTemplate(text: string, config: Pick<Config, 'topic' | 'role' | 'goal'>) {
 return text.replaceAll('{topic}', config.topic.trim()).replaceAll('{role}', lowerFirst(config.role.trim())).replaceAll('{goal}', lowerFirst(config.goal.trim().replace(/[.!]+$/, '')));
}
const GENERIC_STORY = {
 brief: 'Тема встречи: «{topic}». Ваш собеседник — {role}. Его цель: {goal}. Ваша задача — договориться на условиях, выгодных обеим сторонам, и не уступать без встречной ценности.',
 opening: 'Давайте обсудим тему «{topic}». Сразу скажу: для меня важно {goal}, и от этого я отталкиваюсь.',
 frame: { goal: 'Договориться по теме «{topic}» на условиях, которые вы готовы защищать.', batna: 'Ваш запасной вариант, если договориться не удастся: другой партнёр, перенос решения или поэтапный запуск.', zopa: 'Между вашим минимально приемлемым вариантом и пределом собеседника, для которого важно {goal}.' },
};
const initialsOf = (person: string) => person.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]!.toUpperCase()).join('');
/** Texts of the current scenario: the domain story, an administrator's own scenario or templates for a custom topic. */
export function scenarioFor(config: Config) {
 const base = scenarios[config.domain];
 const story = usesStory(config);
 const person = config.custom?.person?.trim() || base.person;
 const frame = config.custom?.frame ?? (story ? base.frame : { goal: fillTemplate(GENERIC_STORY.frame.goal, config), batna: GENERIC_STORY.frame.batna, zopa: fillTemplate(GENERIC_STORY.frame.zopa, config) });
 return {
  story, label: base.label, person, initials: initialsOf(person),
  brief: config.custom?.brief?.trim() || (story ? base.brief : fillTemplate(GENERIC_STORY.brief, config)),
  opening: config.custom?.opening?.trim() || (story ? base.opening : fillTemplate(GENERIC_STORY.opening, config)),
  frame,
 };
}
/** The opponent's first line: the tone chosen by the administrator is audible from the very first message. */
export function openingLine(config: Config) { return OPENING_LEAD[config.tone] + scenarioFor(config).opening; }
/** Domain-specific ending, so the same score reads as a concrete consequence of the negotiation. */
export function finale(config: Config, result: { won: boolean; collapsed: boolean }, completed: boolean) {
 const endings: Record<Domain, { won: string; lost: string; collapsed: string; early: string }> = {
  supplier: { won: 'Годовой контракт: рост цены ограничен, объём гарантирован, а коридор пересмотра защищает обе стороны.', lost: 'Поставщик сохраняет рост на 15%. Остаётся альтернатива — переход к другому поставщику, который займёт месяц.', collapsed: 'Поставщик прекращает переговоры. Закупкам придётся срочно запускать переход к альтернативе.', early: 'Встреча прервана: условия не изменились, и повышение на 15% вступит в силу.' },
  career: { won: 'Вы получаете ведущую роль и согласованный пересмотр зарплаты по измеримым KPI.', lost: 'Повышение отложено: руководитель не увидел проверяемых оснований для решения.', collapsed: 'Разговор сорван, и доверие к вам как к кандидату на рост заметно снизилось.', early: 'Разговор прерван, решение о повышении не принято.' },
  team: { won: 'Ключевая часть релиза выходит в срок без ночных смен, команда получает отгулы после сдачи.', lost: 'Команда работает только в обычном режиме — срок клиента под угрозой.', collapsed: 'Конфликт обострился: ведущий разработчик всерьёз задумался об уходе.', early: 'Разговор прерван, план релиза не согласован.' },
 };
 const generic = { won: 'Договорённость по теме «{topic}» закреплена: условия, ответственные и сроки согласованы.', lost: 'По теме «{topic}» договорённости нет: встречной ценности оказалось недостаточно.', collapsed: 'Переговоры по теме «{topic}» сорваны — вернуть доверие будет непросто.', early: 'Встреча прервана, решение по теме «{topic}» не принято.' };
 const ending = usesStory(config) ? endings[config.domain] : Object.fromEntries(Object.entries(generic).map(([key, text]) => [key, fillTemplate(text, config)])) as typeof generic;
 return result.collapsed ? ending.collapsed : result.won ? ending.won : completed ? ending.lost : ending.early;
}
const choice = (text: string, skill: string, points: number, trust: number, feedback: string): Choice => ({text,skill,points,trust,feedback});
export const stages = [
 'Установить контакт',
 'Сверить позиции',
 'Выяснить интересы',
 'Собрать пакет условий',
 'Снять возражение',
 'Закрепить договорённость',
];
export const SESSION_STAGE_COUNT = stages.length;
export function sessionStageCount(session: { stageCount?: number; ended?: number; turns: unknown[] }) {
 return session.stageCount ?? (session.ended ? Math.max(4, session.turns.length) : SESSION_STAGE_COUNT);
}

/** Hidden interests (Harvard method): the opponent reveals them only when the player touches them in words. */
export type Interest = { id: string; label: string; hint: string; pattern: RegExp; reveal: string };
export const INTERESTS: Record<Domain, Interest[]> = {
 supplier: [
  { id: 'volume', label: 'Прогнозируемая загрузка производства', hint: 'Спросите об объёме и его гарантиях.', pattern: /\b(?:объем|загрузк|гарантированн|партия|партии|заказ)/u, reveal: 'Если честно, главное для нас — прогнозируемая загрузка производства. Стабильный объём позволяет держать себестоимость.' },
  { id: 'payment', label: 'Быстрые платежи и оборотные средства', hint: 'Предложите обсудить график и сроки оплаты.', pattern: /\b(?:оплат|аванс|предоплат|отсрочк|платеж)/u, reveal: 'Сроки оплаты для нас очень чувствительны: ускоренная оплата напрямую снижает наши расходы на оборотные средства.' },
  { id: 'horizon', label: 'Длинный горизонт планирования', hint: 'Предложите долгосрочный или годовой контракт.', pattern: /\b(?:годов|на год|долгосроч|горизонт|длительн|несколько лет|два года)/u, reveal: 'Длинный контракт даёт нам горизонт планирования — под него мы готовы смягчить условия.' },
 ],
 career: [
  { id: 'kpi', label: 'Измеримые критерии, чтобы защитить решение перед руководством', hint: 'Предложите проверяемые KPI.', pattern: /\b(?:kpi|кпи|критери|метрик|измерим|показател)/u, reveal: 'Мне важно, чтобы решение можно было защитить перед руководством, — измеримые критерии здесь решают всё.' },
  { id: 'handover', label: 'Кто закроет текущие задачи', hint: 'Спросите или предложите, как передать текущие задачи.', pattern: /\b(?:передач|передам|передать|текущ\w* задач|делегир|преемник|кто примет|кто возьмет)/u, reveal: 'Меня беспокоит, кто закроет ваши текущие задачи. Хорошо, что вы об этом думаете.' },
  { id: 'budget', label: 'Бюджет этого года почти исчерпан', hint: 'Предложите поэтапное повышение или пересмотр позже.', pattern: /\b(?:поэтап|пересмотр|через (?:три|3|полгода|квартал)|пилот|со следующего|следующ\w* квартал)/u, reveal: 'Поэтапное решение проще уложить в бюджет: сейчас резерв ограничен, а со следующего квартала появится пространство.' },
 ],
 team: [
  { id: 'scope', label: 'Зафиксированный и урезанный объём релиза', hint: 'Предложите сократить релиз до ключевых функций.', pattern: /\b(?:объем|функци|скоуп|scope|приоритет|ключев|mvp|урез|сократ)/u, reveal: 'Если объём зафиксирован и урезан до ключевого — это уже совсем другой разговор.' },
  { id: 'rest', label: 'Отдых команды после рывка', hint: 'Предложите отгулы или компенсацию.', pattern: /\b(?:отгул|отдых|компенсац|выходн|отпуск)/u, reveal: 'Людям нужен отдых после рывка. Отгулы команда точно оценит.' },
  { id: 'quality', label: 'Не выпускать сырой релиз', hint: 'Обсудите тесты и заморозку кода.', pattern: /\b(?:качеств|тест|баг|заморозк|стажер|ревью|стабильн)/u, reveal: 'Для меня принципиально не выпускать сырое. Тесты и заморозка кода снимают этот страх.' },
 ],
};
/** Domain-agnostic interests for a custom topic without its own interests. */
export const GENERIC_INTERESTS: Interest[] = [
 { id: 'risk', label: 'Снижение рисков и гарантии', hint: 'Спросите, какой риск беспокоит собеседника, и предложите гарантию.', pattern: /\b(?:риск|гаранти|страхов|пилот|коридор|подстрах)/u, reveal: 'Если честно, больше всего меня беспокоят риски. С понятными гарантиями разговор пойдёт легче.' },
 { id: 'timing', label: 'Реалистичные сроки и ресурсы', hint: 'Обсудите график, этапы и ресурсы.', pattern: /\b(?:срок|график|этап|ресурс|дата|поэтап)/u, reveal: 'Сроки для меня критичны: под них уже заложены ресурсы, и сдвигать их больно.' },
 { id: 'value', label: 'Выгода, которую можно обосновать', hint: 'Спросите, как собеседник будет защищать решение, и предложите измеримый результат.', pattern: /\b(?:выгод|окупаем|kpi|кпи|результат|эффект|показател|обоснов)/u, reveal: 'Мне нужно обосновать решение: покажите измеримый результат, и я смогу его защитить.' },
];
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function keywordPattern(keywords: string[]) {
 const stems = keywords.map(keyword => normalizeNegotiationText(keyword)).filter(Boolean).map(escapeRegExp);
 return new RegExp(`\\b(?:${stems.join('|') || '(?!)'})`, 'u');
}
/** Hidden interests of the current scenario: from the administrator's JSON, the domain story or generic ones. */
export function interestsFor(config: Config): Interest[] {
 if (config.custom?.interests?.length) return config.custom.interests.map(item => ({ id: item.id, label: item.label, hint: item.hint, reveal: item.reveal, pattern: keywordPattern(item.keywords) }));
 return usesStory(config) ? INTERESTS[config.domain] : GENERIC_INTERESTS;
}
export function discoveredInterests(turns: Turn[]) { return new Set(turns.flatMap(turn => turn.interests ?? [])); }
/**
 * Marks interests the move touches for the first time. Hostile moves reveal nothing.
 * Every new interest adds trust; a free-text reply also earns points (up to the stage maximum) and lowers tension.
 */
export function withInterests(source: Domain | Config, stage: number, c: Choice, turns: Turn[]): Choice {
 const list = typeof source === 'string' ? INTERESTS[source] : interestsFor(source);
 // Only real conflict reveals nothing; a merely weak free-text phrasing can still touch an interest.
 if (c.trust <= (c.freeText ? -10 : -1) || c.intent === 'silence' || c.intent === 'insult' || c.intent === 'threat' || c.intent === 'demand') return c;
 const known = discoveredInterests(turns);
 const text = normalizeNegotiationText(c.text);
 const found = list.filter(item => !known.has(item.id) && semanticMatch(text, item.pattern)).map(item => item.id);
 if (!found.length) {
  // An open question about priorities earns a clue: the opponent names a topic, the player still has to take it up.
  if (!c.cues?.includes('interestQuestion')) return c;
  const hinted = new Set(turns.map(turn => turn.hinted));
  const open = list.filter(item => !known.has(item.id));
  const next = open.find(item => !hinted.has(item.id)) ?? open[0];
  return next ? { ...c, hinted: next.id } : c;
 }
 const maximum = STAGE_MAX[Math.max(0, Math.min(stage, SESSION_STAGE_COUNT - 1))];
 const labels = found.map(id => list.find(item => item.id === id)!.label.toLowerCase()).join('; ');
 return {
  ...c, interests: found, trust: c.trust + 2 * found.length,
  ...(c.freeText ? { points: Math.min(maximum, c.points + 2 * found.length), tension: (c.tension ?? 0) - 3 * found.length, feedback: `${c.feedback} Вы затронули скрытый интерес собеседника: ${labels}.` } : {}),
 };
}

/** Under high tension the opponent does not wait: the player gets a time limit for the answer. */
export const PRESSURE_TIMER_TENSION = 70;
export function pressureTimeLimit(config: Config) { return { Базовый: 45, Продвинутый: 35, Эксперт: 25 }[config.difficulty]; }
export function silenceChoice(): Choice {
 return { text: '(пауза — время на ответ истекло)', skill: 'Молчание под давлением', points: 2, trust: -6, feedback: 'Под давлением вы не успели ответить. Заготовьте короткую фразу, которая выигрывает время: «Мне важно ответить точно — уточню одну деталь…»', tension: 12, intent: 'silence' };
}

/** Deterministic shuffle so the best answer is not always first, yet stays in place after a reload. */
export function arrangeChoices<T>(items: T[], seed: string): T[] {
 let hash = 2166136261;
 for (let i = 0; i < seed.length; i++) { hash ^= seed.charCodeAt(i); hash = Math.imul(hash, 16777619); }
 const random = () => { hash = Math.imul(hash ^ (hash >>> 15), 2246822507); hash = Math.imul(hash ^ (hash >>> 13), 3266489909); return ((hash ^= hash >>> 16) >>> 0) / 4294967296; };
 const result = [...items];
 for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
 return result;
}
const pickStory = (domain: Domain, supplier: string, career: string, team: string) => domain === 'supplier' ? supplier : domain === 'career' ? career : team;
/** Recovery branch offered when tension is close to collapse: the player can de-escalate instead of losing the deal. */
export const RECOVERY_TENSION = 70;
export function recoveryChoice(): Choice {
 return {text:'Похоже, я слишком надавил. Давайте вернёмся на шаг назад: что для вас сейчас самое важное?',skill:'Восстановление контакта',points:12,trust:8,feedback:'Вы признали срыв тона и вернули разговор к интересам. Это снижает напряжённость, но упущенные очки этапа уже не вернуть.',tension:-14,intent:'repair'};
}
/** Answer options of a stage. A Config with a custom topic gets template texts filled with its topic, role and goal. */
export function choices(source: Domain | Config, stage: number, currentTension = 0): Choice[] {
 const domain = typeof source === 'string' ? source : source.domain;
 const template = typeof source === 'string' || usesStory(source) ? null : source;
 const pick = (_domain: Domain, supplier: string, career: string, team: string, generic: string) => template ? fillTemplate(generic, template) : pickStory(domain, supplier, career, team);
 const options = [
 [choice(pick(domain,'Понимаю, что издержки выросли. Давайте посмотрим, как сохранить сотрудничество и экономику обеих сторон.','Спасибо за возможность обсудить мой рост. Хочу найти решение, которое усилит и мой вклад, и команду.','Слышу, что команда на пределе, и это для меня важно. Давайте вместе найдём вариант, который не сожжёт людей и сохранит доверие клиента.','Спасибо, что нашли время. Понимаю, что для вас важно {goal}. Давайте найдём решение, которое сработает для обеих сторон.'), 'Контакт', 17, 11, 'Вы признали позицию собеседника и обозначили общую цель.'), choice(pick(domain,'У других поставщиков дешевле. Снижайте цену, иначе мы уйдём.','Если повышения не будет, мне придётся уйти.','Сроки не обсуждаются. Если вы не готовы, найду того, кто готов.','Если условия нас не устроят, мы просто уйдём к другим. Решайте быстрее.'), 'Угроза уходом', 3, -17, 'Ультиматум сужает пространство для обсуждения. Сначала выясните ограничения.'), choice(pick(domain,'Давайте не будем тратить время: какую скидку вы готовы дать, чтобы мы остались?','Давайте сразу к делу: на какую прибавку я могу рассчитывать?','Давайте без лирики: сколько дней вам не хватает, чтобы успеть к новой дате?','Давайте сразу к цифрам: на какие условия вы готовы пойти?'), 'Торг без контакта', 8, 1, 'Деловой тон уместен, но вы перешли к цифрам, не признав позицию собеседника и не обозначив общую цель. Контакт остался формальным.')],
 [choice(pick(domain,'Правильно понимаю: вам нужен рост на 15%, а для нас приемлемо не больше 5%? Давайте сверим, что ещё входит в условия.','Я рассчитываю на ведущую роль и рост на 15%. Какие ограничения по бюджету и срокам есть у команды?','Правильно понимаю: вы против переработок, а мне нужно показать клиенту ключевую часть через две недели? Давайте сверим, что входит в релиз.','Правильно понимаю: для вас главное — {goal}? Давайте сверим, что входит в предмет договорённости и какие у вас ограничения.'), 'Рамка разговора', 17, 9, 'Вы спокойно обозначили обе позиции и открыли пространство для уточнений.'), choice(pick(domain,'Наша позиция простая: мы готовы принять рост не больше 5%. Давайте от этого и отталкиваться.','Моя позиция: ведущая роль и плюс 15% к зарплате. Давайте от этого и отталкиваться.','Моя позиция: через две недели релиз должен быть у клиента. От этого и будем отталкиваться.','Наша позиция простая, и менять её мы не планируем. Давайте от неё и отталкиваться.'), 'Только своя позиция', 11, 2, 'Граница обозначена ясно, но позиция собеседника и его ограничения остались за кадром — сверки не получилось.'), choice('Моя позиция окончательная. От вас требуется только согласие.', 'Давление', 3, -16, 'Жёсткая фиксация позиции заставляет собеседника защищаться.')],
 [choice(pick(domain,'Что сильнее влияет на цену? Поможет ли гарантированный объём, срок контракта или график оплаты?','Какие результаты, ответственность и сроки позволят вам обосновать повышение?','Что сильнее всего выматывает команду: объём, ночные деплои или правки в последний момент? Что помогло бы выдержать срок?','Что сильнее всего влияет на ваше решение: сроки, риски или ресурсы? Что помогло бы вам согласиться?'), 'Интересы', 19, 12, 'Открытый вопрос переводит разговор от заявленных позиций к интересам и ограничениям.'), choice('Расскажите подробнее, что для вас сейчас самое важное.', 'Уточнение', 13, 6, 'Полезный вопрос. Усильте его вариантами и проверяемыми критериями.'), choice('Ваши внутренние проблемы меня не касаются. Мне нужен результат.', 'Давление', 3, -18, 'Игнорирование ограничений снижает доверие и готовность искать решение.')],
 [choice(pick(domain,'Предлагаю годовой контракт, гарантированный объём и ускоренную оплату в обмен на рост цены не более 5%.','Предлагаю ведущую роль сейчас и рост на 15% либо пересмотр через три месяца по согласованным KPI.','Предлагаю сократить релиз до трёх ключевых функций, подключить стажёра к тестам и дать команде два отгула после сдачи в обмен на срок по ключевой части.','Предлагаю пакет: мы берём на себя часть рисков и фиксируем сроки, а взамен просим условия, которые обсудили. Это закрывает и вашу цель: {goal}.'), 'Взаимный обмен', 19, 10, 'Вы собрали пакет условий и связали уступки со встречной ценностью.'), choice(pick(domain,'Можем согласиться на 10%, если это упростит решение.','Согласен на небольшую прибавку, детали можно обсудить потом.','Давайте без отгулов, а потом я постараюсь что-нибудь компенсировать.','Ладно, в этом вопросе уступим, а детали обсудим потом.'), 'Односторонний компромисс', 11, 3, 'Компромисс возможен, но уступка без встречного условия ослабляет позицию.'), choice('Это моё последнее предложение. Обсуждать больше нечего.', 'Давление', 3, -20, 'Жёсткая позиция без аргументов блокирует совместный поиск.')],
 [choice(pick(domain,'Понимаю риск по объёму. Давайте добавим квартальный коридор и пересмотр цены, если объём отклонится больше чем на 10%.','Понимаю риск бюджета. Давайте ограничим пилот тремя месяцами и заранее согласуем измеримые критерии результата.','Понимаю риск по качеству. Давайте заморозим код за три дня до релиза, а если критичных багов больше пяти, перенесём вторую часть.','Понимаю ваш риск. Давайте добавим контрольную точку: пилотный этап и пересмотр условий, если согласованные показатели не будут достигнуты.'), 'Работа с риском', 17, 10, 'Вы признали возражение и предложили механизм, который снижает риск собеседника.'), choice('Какая часть предложения вызывает у вас больше всего сомнений?', 'Диагностика возражения', 12, 6, 'Вы уточняете причину сомнений, но следующему ходу понадобится конкретное решение.'), choice('Вы просто ищете повод отказать. Это несерьёзно.', 'Обесценивание', 2, -19, 'Обесценивание возражения усиливает сопротивление и разрушает рабочий контакт.')],
 [choice(pick(domain,'Зафиксируем цену, объём, коридор отклонения и сроки поставок письменно. Сверим проект договора в пятницу?','Зафиксируем роль, KPI, ресурсы и дату пересмотра через три месяца. Я отправлю итоги встречи сегодня.','Зафиксируем объём релиза, дату заморозки кода, отгулы и ответственного за тесты. Я отправлю план команде и клиенту сегодня.','Зафиксируем условия, ответственных и сроки письменно. Я отправлю протокол встречи сегодня — подтвердите, всё ли верно?'), 'Фиксация', 18, 10, 'Конкретные условия, ответственный и срок превращают разговор в проверяемую договорённость.'), choice('Отлично, в целом договорились. Детали согласуем по почте.', 'Размытая фиксация', 9, 1, 'Звучит как итог, но без конкретных условий, ответственного и срока договорённость легко «расползётся».'), choice('Отлично, считаю, что вы согласились со всем.', 'Допущение', 3, -10, 'Проверьте согласие собеседника, прежде чем объявлять о договорённости.')]
 ][Math.max(0, Math.min(stage, SESSION_STAGE_COUNT - 1))];
 // Near collapse the neutral option turns into a de-escalation branch.
 return currentTension >= RECOVERY_TENSION ? [options[0], recoveryChoice(), options[2]] : options;
}

type TextSignals = {
 meaningfulWords:number;
 openQuestion:boolean;
 checkQuestion:boolean;
 rapport:boolean;
 empathy:boolean;
 acknowledgesOther:boolean;
 collaboration:boolean;
 mutualValue:boolean;
 selfPosition:boolean;
 otherPosition:boolean;
 boundary:boolean;
 interests:boolean;
 reasons:boolean;
 alternatives:boolean;
 proposal:boolean;
 reciprocity:boolean;
 counterpartValue:boolean;
 objection:boolean;
 mitigation:boolean;
 contingency:boolean;
 closing:boolean;
 written:boolean;
 owner:boolean;
 deadline:boolean;
 confirms:boolean;
 termGroups:number;
 domainRelevant:boolean;
};

type StageAssessment = {
 skill:string;
 intent:NegotiationIntent;
 points:number;
 strengths:string[];
 improvements:string[];
 gaps:GapId[];
};

const STAGE_MAX=[17,17,19,19,17,18] as const;
const SPEECH_FILLERS=/(?<![\p{L}\p{N}_])(?:ну|ээ+|эм+|как бы|в общем|короче|значит|вот|скажем так|так сказать)(?![\p{L}\p{N}_])/gu;
const UNICODE_WORD_BOUNDARY='(?:(?<![\\p{L}\\p{N}_])(?=[\\p{L}\\p{N}_])|(?<=[\\p{L}\\p{N}_])(?![\\p{L}\\p{N}_]))';

function normalizeNegotiationText(value:string) {
 return value.normalize('NFKC').toLowerCase().replace(/ё/g,'е').replace(/[«»“”]/g,'"').replace(/[—–]/g,'-').replace(/\s+/g,' ').trim();
}

function countTrue(values:boolean[]) { return values.reduce((sum,value)=>sum+(value?1:0),0); }
function semanticMatch(text:string,pattern:RegExp) {
 const flags=pattern.flags.replace('g','');
 return new RegExp(pattern.source.replaceAll('\\b',UNICODE_WORD_BOUNDARY),flags.includes('u')?flags:`${flags}u`).test(text);
}

function detectSignals(text:string,domain:Domain):TextSignals {
 const speech=text.replace(SPEECH_FILLERS,' ').replace(/\s+/g,' ').trim();
 const words=speech.match(/[a-zа-я0-9%]+/giu)??[];
 const openQuestion=semanticMatch(speech,/\b(?:какие|какой|какая|почему|зачем|сколько|когда)\b|\bкак (?:вы|мы|это|лучше|можно)\b|\bчто (?:для вас|вам|сильнее|мешает|нужно|важнее|повлияет)\b|\bрасскаж(?:ите|и)|\bпоможет ли\b|\bможем ли\b/u);
 const checkQuestion=semanticMatch(speech,/\b(?:правильно|верно) ли (?:я |мы )?(?:понима|зафиксир)|\bправильно (?:ли )?(?:я |мы )?понима|\bдавайте сверим|\bсверим (?:позиции|условия|понимание)|\bуточню[: ,]/u);
 const rejectsUnderstanding=semanticMatch(speech,/\b(?:не понимаю|не вижу|мне безразлично|мне все равно)/u);
 const rapport=semanticMatch(speech,/\b(?:здравствуй|добрый (?:день|вечер)|доброе утро|приветству|рад(?:а)? (?:встрече|знакомству|вас видеть)|спасибо|благодар)/u);
 const empathy=!rejectsUnderstanding&&semanticMatch(speech,/\b(?:понимаю|вижу,? что|слышу,? что|признаю|ценю|спасибо за|учитываю|согласен,? что)/u);
 const acknowledgesOther=!rejectsUnderstanding&&semanticMatch(speech,/\b(?:понимаю|вижу|слышу|признаю|учитываю)[, ]+(?:что|ваш|вашу|ваши)|\b(?:для вас|вам важно|ваша позици|ваши услов|ваш интерес|ваша цель|вы хотите|вы предлагаете|вас беспокоит)/u);
 const collaboration=!semanticMatch(speech,/\b(?:не хочу|не будем|не готов) (?:обсуждать|искать|продолжать)/u)&&semanticMatch(speech,/\b(?:давайте|вместе|готов(?:ы)? обсудить|найд[её]м решение|найти решение|поиск решения|продолжить диалог|разобраться вместе|сверим)/u);
 const mutualValue=semanticMatch(speech,/\b(?:обеих сторон|для обеих|взаимн|и для вас,? и для нас|сохранить (?:сотрудничество|отношения)|общая цель|интересы команды|усилит (?:команду|сотрудничество))/u);
 const selfPosition=semanticMatch(speech,/\b(?:наша позици|моя позици|для нас|нам важно|мы готовы|мы можем|я рассчитываю|моя цель|наш(?:и|) предел|для меня|нам приемлем|я хочу)/u);
 const otherPosition=semanticMatch(speech,/\b(?:ваша позици|ваши услов|для вас|вам важно|вы хотите|вы предлагаете|ваша цель|вам нужен|вам требуется)/u);
 const boundary=semanticMatch(speech,/\b(?:не более|не меньше|в пределах|огранич|бюджет|максим|миним|приемлем|предел|рамк|красная линия|услови)/u);
 const interests=semanticMatch(speech,/\b(?:интерес|приоритет|важн|потребност|цель|мотивац|опасени|ожидани|что вы хотите|что вам нужно)/u);
 const reasons=semanticMatch(speech,/\b(?:почему|причин|что (?:сильнее )?влияет|из-за чего|ограничени|что мешает|что стоит за|риск|обоснов|основани)/u);
 const alternatives=semanticMatch(speech,/\b(?:вариант|альтернатив|либо|или|что если|при каком условии|какие еще|иначе можно|несколько решений)/u);
 const proposal=!semanticMatch(speech,/\bне предлага/u)&&semanticMatch(speech,/\b(?:предлага|готов(?:ы)?|можем|давайте (?:добавим|зафиксируем|согласуем|сделаем)|обязуем|бер[её]м на себя|вариант такой|давайте так|предлож(?:у|им|ение)|я (?:беру|возьму|могу|готова?))/u);
 const reciprocity=semanticMatch(speech,/\b(?:в обмен на|если .{2,80},? то|при условии|со своей стороны|встречн|взамен|за это|с вашей стороны)/u);
 const counterpartValue=semanticMatch(speech,/\b(?:для вас это|вам даст|снизит ваш|снимет ваш|сохранит|гарантирует вам|гарантированн(?:ый|ого) объем|учтет ваши|вы получите|поможет вам|ваша выгода)/u);
 const objection=semanticMatch(speech,/\b(?:понимаю|вижу|признаю|учитываю)[^.!?]{0,35}\b(?:риск|опасени|сомнени|возражени|ограничени|бюджет)|\b(?:вас беспокоит|главное возражение|риск для вас)/u);
 const mitigation=semanticMatch(speech,/\b(?:снизить риск|снять риск|чтобы избежать|решим это|механизм|коридор|пилот|гаранти|страхов|этапн|контрольн|пересмотр|компенсир|защит)/u);
 const contingency=semanticMatch(speech,/\b(?:если|при отклонении|в случае|при условии|по итогам|после проверки|при достижении|в зависимости от)/u);
 const closing=semanticMatch(speech,/\b(?:зафиксир|подведем итог|итак,?|договорились|согласуем|закрепим|следующий шаг|резюмир|оформим)/u);
 const written=semanticMatch(speech,/\b(?:письмен|письмо|договор|протокол|резюме встречи|проект|документ|итоги встречи)/u);
 const owner=semanticMatch(speech,/\b(?:я отправлю|я подготовлю|мы отправим|мы подготовим|вы направите|ответственн|кто делает|беру на себя|назначим|со своей стороны)/u);
 const deadline=semanticMatch(speech,/\b(?:сегодня|завтра|в пятниц|до [а-я0-9]|через \w+ (?:дн|недел|месяц)|дата|срок|к \d|\d{1,2}[./]\d{1,2})/u);
 const confirms=semanticMatch(speech,/\b(?:подтвердите|верно ли зафиксир|правильно ли зафиксир|согласны ли|все верно|ничего не упустили|сверим итог|подтверждаете)/u);
 const termPatterns=[
  /(?:\d|\b(?:один|два|три|четыре|пять|шесть|семь|восемь|девять|десять)\b)[\w ]{0,12}(?:%|процент|рубл|тысяч|миллион)?/u,
  /\b(?:цен|стоимост|скидк|зарплат|бюджет|марж|оплат|аванс)/u,
  /\b(?:объем|поставк|партия|контракт|заказ|график)/u,
  /\b(?:роль|ответственност|задач|полномочи|ресурс|команд)/u,
  /\b(?:kpi|кпи|критери|показател|результат|метрик)/u,
  /\b(?:срок|дата|день|недел|месяц|квартал|год|сегодня|завтра|пятниц)/u,
 ];
 const domainPattern=domain==='supplier'?/\b(?:себестоимост|марж|объем|поставк|оплат|контракт|цен)/u:domain==='career'?/\b(?:роль|зарплат|kpi|кпи|ответственност|команд|проект|результат)/u:/\b(?:команд|релиз|срок|переработ|отгул|нагрузк|спринт|качеств|баг|объем|стажер)/u;
 const termGroups=countTrue(termPatterns.map(pattern=>semanticMatch(speech,pattern)));const domainRelevant=semanticMatch(speech,domainPattern);
 return {meaningfulWords:words.length,openQuestion,checkQuestion,rapport,empathy,acknowledgesOther,collaboration,mutualValue,selfPosition,otherPosition,boundary,interests,reasons,alternatives,proposal,reciprocity,counterpartValue,objection,mitigation,contingency,closing,written,owner,deadline,confirms,termGroups,domainRelevant};
}

function assessStage(stage:number,s:TextSignals):StageAssessment {
 const current=Math.max(0,Math.min(stage,SESSION_STAGE_COUNT-1));
 let raw=3;let skill='Уточнение';let intent:NegotiationIntent='scripted';const strengths:string[]=[];const improvements:string[]=[];
 const add=(condition:boolean,points:number,label:string)=>{if(condition){raw+=points;strengths.push(label)}};
 const gaps:GapId[]=[];const need=(gap:GapId,advice:string)=>{improvements.push(advice);if(!gaps.includes(gap))gaps.push(gap)};
 if(current===0){
  skill='Контакт';
  add(s.empathy,4,'эмпатия');add(s.acknowledgesOther,3,'признание позиции собеседника');add(s.collaboration,4,'приглашение к диалогу');add(s.mutualValue,3,'общая ценность');
  // Politeness and a question about interests are good openings too, even though they belong to later stages of the method.
  add(s.rapport,2,'вежливое начало');add(s.openQuestion&&(s.interests||s.reasons),4,'вопрос об интересах');
  if(!s.empathy&&!s.acknowledgesOther)need('acknowledge','Признайте позицию или переживание собеседника.');
  if(!s.collaboration)need('together','Предложите вместе искать решение.');
  if(!s.mutualValue)need('common','Назовите общую цель или ценность отношений.');
 }else if(current===1){
  skill='Рамка разговора';intent=s.openQuestion||s.checkQuestion?'question':'scripted';
  add(s.checkQuestion,4,'проверка понимания');add(s.selfPosition,3,'ваша позиция');add(s.otherPosition,3,'позиция собеседника');add(s.boundary,3,'границы и ограничения');add(s.openQuestion,2,'вопрос на сверку');
  if(!s.selfPosition||!s.otherPosition)need('positions','Обозначьте позиции обеих сторон, не подменяя одну другой.');
  if(!s.checkQuestion&&!s.openQuestion)need('check','Проверьте, одинаково ли вы понимаете условия и ограничения.');
  if(!s.boundary)need('boundary','Добавьте конкретную границу, критерий или ограничение.');
 }else if(current===2){
  skill='Интересы';intent='question';
  add(s.openQuestion,4,'открытый вопрос');add(s.interests,4,'фокус на интересах');add(s.reasons,3,'поиск причин и ограничений');add(s.alternatives||s.termGroups>=2,3,'исследование нескольких параметров');add(s.domainRelevant,2,'предметная область вопроса');
  if(!s.openQuestion)need('openQuestion','Задайте открытый вопрос, на который нельзя ответить только «да» или «нет».');
  if(!s.interests&&!s.reasons)need('openQuestion','Спросите о приоритетах, причинах или скрытых ограничениях.');
  if(!s.alternatives&&s.termGroups<1)need('axes','Предложите несколько осей для ответа: срок, объём, ресурсы или критерии.');
 }else if(current===3){
  skill='Взаимный обмен';intent='proposal';
  add(s.proposal,3,'ясное предложение');add(s.termGroups>=2,4,'несколько конкретных условий');add(s.reciprocity,5,'встречный обмен');add(s.counterpartValue||s.mutualValue,3,'ценность для второй стороны');add(s.alternatives||s.contingency,2,'вариативность условий');
  if(!s.proposal)need('proposal','Сформулируйте предложение как конкретный следующий ход.');
  if(s.termGroups<2)need('terms','Свяжите минимум два условия: цену, срок, объём, роль, KPI или ресурсы.');
  if(!s.reciprocity)need('exchange','Покажите обмен: что вы даёте и что ожидаете взамен.');
 }else if(current===4){
  skill='Работа с возражением';intent=s.mitigation?'proposal':'question';
  add(s.objection,4,'признание возражения');add(s.openQuestion,3,'диагностика сомнения');add(s.mitigation,4,'механизм снижения риска');add(s.contingency,3,'условие пересмотра');add(s.termGroups>=2,2,'проверяемые параметры');
  if(!s.objection)need('objection','Сначала назовите риск или сомнение собеседника своими словами.');
  if(!s.openQuestion&&!s.mitigation)need('mitigation','Уточните причину возражения или предложите способ снизить риск.');
  if(!s.contingency&&s.termGroups<2)need('contingency','Добавьте проверяемый механизм: пилот, критерий, коридор или дату пересмотра.');
 }else{
  skill='Фиксация';intent='commitment';
  add(s.closing,4,'фиксация итога');add(s.termGroups>=2,3,'конкретные условия');add(s.written,2,'письменное подтверждение');add(s.owner,3,'ответственный');add(s.deadline,3,'срок');add(s.confirms,2,'проверка согласия');
  if(!s.closing)need('summary','Кратко зафиксируйте, о чём договорились.');
  if(!s.owner||!s.deadline)need('owner','Назовите ответственного и срок следующего шага.');
  if(!s.written&&!s.confirms)need('written','Предложите письменное подтверждение или проверьте согласие второй стороны.');
 }
 const evidenceCap=strengths.length===0?8:strengths.length===1?11:strengths.length===2?14:STAGE_MAX[current];
 const lengthCap=s.meaningfulWords<3?7:s.meaningfulWords<6?11:STAGE_MAX[current];
 return {skill,intent,points:Math.max(3,Math.min(raw,evidenceCap,lengthCap,STAGE_MAX[current])),strengths,improvements,gaps};
}

// Insults are matched from the start of a word so ordinary words such as «плохо» or «хлеба» are not flagged.
const INSULT=/(?<![\p{L}\p{N}_])(?:на\s*хуй|нахуй|хуесос|хуй|хуйн|еба|ебан|ебл|пизд|мудак|дебил|идиот|туп(?:ой|ая|ые|ица)(?![\p{L}])|ублюд|мраз|говн|заткнись|пошел (?:вон|на|ты)|придур|урод|лох(?:и|а|ушка)?(?![\p{L}])|лошара)/u;
const THREAT=/(?:иначе (?:мы |я )?(?:уйд|откаж|разорв|пойд|найд|ищ|сорв|придется|будем вынужден|пожалеете)|ультиматум|обязаны|последнее предложение|только согласие|мы уйдем|я уйду|никаких обсуждений)/;
const HOSTILE_INTENTS:NegotiationIntent[]=['insult','threat','demand'];
// A calm reference to one's alternative (BATNA), as opposed to a threat to leave.
const BATNA=/\b(?:альтернатив|другой поставщик|другого поставщика|другое предложение|предложение от друг|контроффер|оффер|поэтапн\w* поставк|запасной вариант)/u;

/** `previous` is the last completed turn: an apology only earns credit after an actual conflict. */
export function evaluateText(text: string, domain: Domain, stage: number, previous?: Choice): Choice {
 const clean = text.trim();
 const t = normalizeNegotiationText(clean);
 const make = (skill:string,points:number,trust:number,feedback:string,tensionDelta:number,intent:NegotiationIntent):Choice => ({text:clean,skill,points,trust,feedback,tension:tensionDelta,intent,freeText:true});
 if (INSULT.test(t)) {
  return make('Оскорбление',0,-32,'Оскорбление мгновенно разрушает рабочий контакт. Остановитесь, признайте срыв и верните разговор к предметным условиям.',50,'insult');
 }
 const repairing=Boolean(previous&&(previous.trust<0||(previous.intent&&HOSTILE_INTENTS.includes(previous.intent))));
 if (repairing&&/(извин|прошу прощ|сорвался|был неправ|перегнул|надавил|вернемся к конструктив|давайте начнем заново)/.test(t)) {
  return make('Восстановление контакта',12,7,'Вы признали сбой и предложили вернуться к делу. После конфликта добавьте конкретный спокойный вопрос.',-10,'repair');
 }
 if (THREAT.test(t)) {
  return make('Ультиматум',2,-23,'Угроза заставляет собеседника защищаться и резко приближает срыв сделки.',34,'threat');
 }
 if (semanticMatch(t,/\b(?:ваши проблемы меня не|меня не волнует|мне не важно|не касается|это несерьезно|вы просто ищете повод|обсуждать нечего|не вижу смысла обсуждать)/u)) {
  return make('Обесценивание',2,-20,'Вы отвергли интересы или возражение второй стороны. Такой ход усиливает сопротивление и не решает задачу этапа.',28,'demand');
 }
 const signals=detectSignals(t,domain);
 // What the opponent can answer in the player's own words: a question, a figure, an offer, a greeting.
 const cues=cuesOf(clean,signals);const figure=figureOf(clean);
 const heard=(c:Choice):Choice=>({...c,...(cues.length?{cues}:{}),...(figure?{figure}:{})});
 const hasSemanticEvidence=Object.values(signals).some(value=>value===true)||signals.termGroups>0;
 const isDemand=/(требую|дайте|снижайте|повышайте|мне нужно|мне нужен|вы должны|согласитесь|принимайте)/.test(t);
 if (/^(?:хорошо[, ]*)?(?:я |мы )?(?:согласен|согласны|принимаю|принимаем)(?: со всем| на все| на (?:любые|ваши|эти) условия| любые условия| ваши условия)[.! ]*$/.test(t)) {
  return {...make('Безусловная уступка',5,2,'Согласие без проверки условий сохраняет спокойствие, но лишает вас переговорной позиции. Уточните предмет, границы и встречное обязательство.',7,'vague'),cues:[...cues,'concession']};
 }
 if ((signals.meaningfulWords<4&&!hasSemanticEvidence) || /^(?:ладно|хорошо|не знаю|решайте|думайте|просто сделайте|ну и что)[.! ]*$/.test(t)) {
  return heard(make('Без конкретики',5,-5,'Собеседнику не за что зацепиться: нет вопроса, условия или следующего шага. Напряжённость растёт из-за неопределённости.',14,'vague'));
 }
 // «Мне нужно…» inside a check question or next to the other side's position is framing, not a demand.
 if (isDemand&&!signals.mutualValue&&!signals.reciprocity&&!signals.openQuestion&&!signals.checkQuestion&&!signals.acknowledgesOther) {
  return heard(make('Одностороннее требование',5,-10,'Требование обозначает вашу позицию, но не даёт собеседнику встречной ценности или выбора.',19,'demand'));
 }
 const assessment=assessStage(stage,signals);const maximum=STAGE_MAX[Math.max(0,Math.min(stage,SESSION_STAGE_COUNT-1))];const quality=assessment.points/maximum;
 const polite=quality<.5&&(signals.rapport||signals.empathy);
 const {trust,tension:tensionDelta}=qualityEffects(quality,polite);
 const positive=assessment.strengths.length?`Сработало: ${assessment.strengths.slice(0,3).join(', ')}.`:'Ход пока не решает задачу этого этапа.';
 const advice=assessment.improvements[0]??'Формулировка сочетает несколько сильных элементов этапа.';
 const intent=assessment.points<=7&&!signals.openQuestion&&!signals.proposal?'vague':assessment.intent;
 const gaps=assessment.gaps.length?{gaps:assessment.gaps}:{};
 if (semanticMatch(t,BATNA)) {
  // Naming the alternative calmly strengthens the position without pressure.
  return heard({...make(assessment.skill,Math.min(maximum,assessment.points+2),Math.max(trust,2),`Вы спокойно опёрлись на свою альтернативу (BATNA): это усиливает позицию без угроз. ${positive} ${advice}`,Math.min(tensionDelta,2),intent),technique:'batna',...gaps});
 }
 return heard({...make(assessment.skill,assessment.points,trust,`${positive} ${advice}`,tensionDelta,intent),...gaps});
}
/** Trust and tension that a free-text move of a given quality (share of the stage maximum) brings. */
function qualityEffects(quality:number,polite:boolean){
 // A polite move that misses the stage is weak, but it is not an attack: no loss of trust, less tension.
 return {trust:quality>=.85?10:quality>=.68?6:quality>=.5?2:polite?0:-4,tension:quality>=.85?-9:quality>=.68?-4:quality>=.5?4:polite?6:11};
}
/** What each missing piece means, worded for the AI assessor and for the player's feedback. */
export const GAP_CRITERIA: Record<GapId,string> = {
 acknowledge:'признаёт позицию или трудность собеседника',
 together:'приглашает вместе искать решение',
 common:'называет общую цель или ценность отношений',
 positions:'обозначает позиции обеих сторон',
 check:'проверяет, одинаково ли стороны понимают условия',
 boundary:'называет свою границу или ограничение',
 openQuestion:'задаёт открытый вопрос о причинах или приоритетах собеседника',
 axes:'затрагивает несколько параметров: сроки, объём, ресурсы',
 proposal:'делает конкретное предложение',
 terms:'связывает минимум два условия',
 exchange:'предлагает встречный обмен: что даёт взамен',
 objection:'называет риск или опасение собеседника',
 mitigation:'предлагает способ снизить риск',
 contingency:'предлагает условие пересмотра или контрольную точку',
 summary:'подводит итог договорённости',
 owner:'называет ответственного и срок',
 written:'предлагает письменное подтверждение или проверяет согласие',
};
/** Points per element the AI assessor confirms, and how many it may confirm in one move. */
export const AI_CREDIT_POINTS = 2;
export const AI_CREDIT_LIMIT = 2;
/**
 * Adds the elements the on-device model confirmed with a quote from the move. The keyword score stays the base:
 * the model can only credit missing pieces, a few points each, within the stage maximum, and the feedback names the quote.
 */
export function applyAiCredit(c:Choice,stage:number,confirmed:{gap:GapId;quote:string}[]):Choice{
 if(!c.freeText||!c.gaps?.length)return c;
 const credit=confirmed.filter((item,index)=>c.gaps!.includes(item.gap)&&confirmed.findIndex(other=>other.gap===item.gap)===index).slice(0,AI_CREDIT_LIMIT);
 if(!credit.length)return c;
 const current=Math.max(0,Math.min(stage,SESSION_STAGE_COUNT-1));const maximum=STAGE_MAX[current];
 const points=Math.min(maximum,c.points+AI_CREDIT_POINTS*credit.length);
 const polite=Boolean(c.cues?.includes('greeting')||c.cues?.includes('empathy'));
 const effects=qualityEffects(points/maximum,polite);
 const batna=c.technique==='batna';
 const credited=credit.map(item=>`${GAP_CRITERIA[item.gap]} («${item.quote}»)`).join('; ');
 return {...c,points,trust:batna?Math.max(effects.trust,2):effects.trust,tension:batna?Math.min(effects.tension,2):effects.tension,
  gaps:c.gaps.filter(gap=>!credit.some(item=>item.gap===gap)),aiCredit:credit,
  feedback:`${c.feedback} Локальная нейросеть засчитала то, что ключевые слова не распознали: ${credited}.`};
}
function cuesOf(text:string,s:TextSignals):Cue[]{
 const cues:Cue[]=[];
 if(s.rapport)cues.push('greeting');
 if(s.checkQuestion)cues.push('checkQuestion');
 // An open question addressed to the opponent («что для вас…», «какая часть неизбежна для вас?») is a question about interests.
 if(s.openQuestion&&(s.interests||s.reasons||s.otherPosition))cues.push('interestQuestion');
 else if(!s.checkQuestion&&(s.openQuestion||text.includes('?')))cues.push('question');
 if(s.empathy)cues.push('empathy');
 if(s.proposal)cues.push('proposal');
 if(s.reciprocity)cues.push('exchange');
 return cues;
}
const NUMBER_WORD='(?:один|одн[аоу]|два|две|три|четыре|пять|шесть|семь|восемь|девять|десять|пятнадцать|двадцать|тридцать|сорок|пятьдесят|сто)';
const FIGURE=new RegExp(`(?<![\\p{L}\\p{N}])(?:\\d+(?:[.,]\\d+)?|${NUMBER_WORD}(?:\\s+${NUMBER_WORD})?)\\s*(?:%|процент\\p{L}*|руб\\p{L}*|₽|тыс\\p{L}*|млн|миллион\\p{L}*|млрд|дн(?:я|ей|ь)|недел\\p{L}*|месяц\\p{L}*|квартал\\p{L}*|год(?:а|ов)?|лет|мвт)(?![\\p{L}])`,'iu');
/** The first figure with a unit the player names («5%», «пять процентов», «три месяца»). */
function figureOf(text:string){return text.match(FIGURE)?.[0].replace(/\s+/g,' ').trim()}
export function threshold(config: Config) { return { 'Базовый': 52, 'Продвинутый': 65, 'Эксперт': 78 }[config.difficulty]; }
const FEMALE_EXCEPTIONS = new Set(['илья', 'никита', 'кузьма', 'фома', 'лука', 'савва', 'данила']);
/** Grammatical gender from the first name, so the opponent says «готов» or «готова» correctly. */
export function personaGender(person: string): 'male' | 'female' {
 const first = person.trim().split(/\s+/)[0]?.toLowerCase() ?? '';
 return /[ая]$/.test(first) && !FEMALE_EXCEPTIONS.has(first) ? 'female' : 'male';
}
const gendered = (config: Config) => (male: string, female: string) => personaGender(scenarioFor(config).person) === 'female' ? female : male;
/** A stable choice between phrasings, so repeated games do not sound identical yet a reload shows the same line. */
function variant(options: string[], seed: string) {
 let hash = 0;
 for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
 return options[hash % options.length];
}
/** The opponent asks for what the move lacks: the stage assessment turned into their own voice, in several phrasings. */
const GAP_LINES: Record<GapId, string[]> = {
 acknowledge: ['Мне важно понять, слышите ли вы мою сторону.', 'Для начала хочу убедиться, что вы видите мою ситуацию.', 'Пока я не слышу, что вы учитываете мои ограничения.'],
 together: ['Готовы ли вы искать решение вместе, а не только отстаивать своё?', 'Мне нужен партнёр по решению, а не оппонент. Вы готовы так работать?', 'Давайте договоримся искать вариант вместе — иначе мы просто будем торговаться.'],
 common: ['Назовите, что нас объединяет в этом вопросе, — от этого проще двигаться.', 'Что для нас обоих важно сохранить, кроме цифр?', 'Если у нас есть общая цель, её стоит проговорить вслух.'],
 positions: ['Давайте проговорим обе позиции — и вашу, и мою.', 'Сначала сверим, где стоите вы и где стою я.', 'Я пока слышу одну сторону. Как вы видите мою позицию?'],
 check: ['Проверьте, одинаково ли мы понимаем условия.', 'Уточните, правильно ли вы поняли мои условия, — чтобы не спорить о разном.', 'Давайте сверим понимание, прежде чем идти дальше.'],
 boundary: ['И где для вас граница, за которую вы не пойдёте?', 'Назовите свой предел — так мне будет понятнее, есть ли поле для договорённости.', 'Какой вариант для вас уже неприемлем?'],
 openQuestion: ['Спросите, что стоит за моей позицией, — я отвечу.', 'Вы пока не спросили, почему я на этом настаиваю.', 'Задайте вопрос, на который нельзя ответить одним «да» или «нет».'],
 axes: ['Давайте смотреть шире одного параметра: есть сроки, объёмы, ресурсы.', 'Кроме цены есть и другие рычаги — сроки, объём, условия.', 'Одним параметром мы друг друга не устроим. Что ещё можно двигать?'],
 proposal: ['Что конкретно вы предлагаете?', 'Сформулируйте предложение — с ним уже можно работать.', 'Мне нужен конкретный вариант, а не направление.'],
 terms: ['Свяжите хотя бы два условия, чтобы мне было что взвесить.', 'Одно условие — это позиция, два и больше — уже пакет.', 'Добавьте к этому срок или объём, тогда я смогу оценить.'],
 exchange: ['И что вы готовы дать взамен?', 'Что я получаю со своей стороны?', 'Уступка без встречного шага мне не подходит. Что с вашей стороны?'],
 objection: ['Мой главный риск вы пока не назвали.', 'Вы обходите то, что меня беспокоит больше всего.', 'Прежде чем соглашаться, я хочу услышать, что вы понимаете мой риск.'],
 mitigation: ['Как вы предлагаете снизить этот риск?', 'Какой механизм защитит меня, если что-то пойдёт не так?', 'Мне нужна страховка, а не обещание.'],
 contingency: ['Что будет, если что-то пойдёт не по плану?', 'Давайте заранее договоримся, как пересматриваем условия при отклонении.', 'Нужна контрольная точка: когда и по какому критерию мы проверим результат?'],
 summary: ['Давайте коротко проговорим, о чём мы договорились.', 'Подведите итог — хочу убедиться, что мы поняли друг друга одинаково.', 'Перечислите пункты, под которыми мы оба подпишемся.'],
 owner: ['Кто и к какому сроку делает следующий шаг?', 'Назовите ответственного и дату — иначе всё затянется.', 'Кто отправит итоги и когда?'],
 written: ['Закрепим это письменно?', 'Без протокола через неделю мы будем помнить разное.', 'Давайте зафиксируем это в письме или протоколе.'],
};
/**
 * Stage stance for free text: unlike the scripted replies it never refers to words the player did not say.
 * A tough opponent sounds curter, a friendly one warmer; {рад}-style words take the persona's gender.
 */
type Stance = { strong: string[]; weak: string[]; hard: string[]; warm: string[] };
const FREE_CORE: Stance[] = [
 { strong: ['С таким настроем можно работать.', 'Хорошее начало для разговора.', 'Вот с этого и стоит начинать.', 'Так разговаривать приятно.'], weak: ['Пока я не очень понимаю, с чем вы пришли.', 'Давайте сначала поймём, чего мы оба хотим от этой встречи.', 'Пока это общие слова.', 'Мне не хватает понимания, зачем мы встретились.'], hard: ['Время ограничено — давайте к сути.', 'Вежливость принята, но мне нужна суть.'], warm: ['Я {рад}, что мы начали спокойно, но пока не понимаю, с чем вы пришли.', 'Спасибо за настрой — теперь давайте к сути.'] },
 { strong: ['Рамка понятна, от неё и будем двигаться.', 'Да, так картина становится яснее.', 'Хорошо, позиции на столе.', 'С такой сверкой дальше будет проще.'], weak: ['Пока я слышу только часть картины.', 'Мы пока говорим каждый о своём.', 'Позиции ещё не сверены.', 'Мне не ясно, как вы видите мою сторону.'], hard: ['Позиции я знаю. Где пространство для манёвра?'], warm: ['Давайте спокойно сверим, как каждый из нас видит ситуацию.'] },
 { strong: ['Вы смотрите в корень.', 'С этого и стоит начинать поиск решения.', 'Такой вопрос я {готов} обсуждать всерьёз.', 'Это правильный разговор — про причины, а не про цифры.'], weak: ['Пока мы обсуждаем позиции, а не то, что за ними стоит.', 'Мне сложно раскрыться, пока разговор идёт вокруг требований.', 'Вы пока не спросили о главном.', 'Так мы не узнаем, что на самом деле важно.'], hard: ['Требования я {слышал}. Интересы вас не интересуют?'], warm: ['Мне было бы проще, если бы вы спросили, что для меня важно.'] },
 { strong: ['Такой пакет уже можно обсуждать предметно.', 'Это похоже на предложение, с которым можно работать.', 'Вот теперь есть что взвешивать.', 'С таким обменом можно двигаться дальше.'], weak: ['Пока это не похоже на пакет, под которым я могу подписаться.', 'Мне не хватает конкретики, чтобы принять решение.', 'Это пока односторонняя история.', 'На таких условиях мне нечего взвешивать.'], hard: ['Без встречных условий это не пакет.'], warm: ['Вижу, что вы стараетесь, но конкретики пока мало.'] },
 { strong: ['Это снимает большую часть моих опасений.', 'С таким механизмом риск выглядит управляемым.', 'Вот это уже похоже на страховку.', 'Так я смогу защитить решение у себя.'], weak: ['Моё опасение пока остаётся.', 'Риск по-прежнему лежит на мне.', 'Слова понятны, механизма пока нет.', 'Я пока не вижу, что меня защитит.'], hard: ['Обещания не снимают риск. Нужен механизм.'], warm: ['Понимаю ваше желание, но риск для меня всё ещё реален.'] },
 { strong: ['Да, так и зафиксируем. Жду протокол — сверю пункты со своей стороны.', 'Договорились, картина общая. Как получу итоговый документ, подтвержу его со своей стороны.', '{Согласен} с итогом. Пришлите протокол — отвечу в тот же день.', 'Фиксируем. Жду письмо с пунктами и сроками.'], weak: ['По сути мы близко, но договорённость пока размыта.', 'Пока это звучит как намерение, а не договорённость.', 'Без конкретных пунктов это ещё не итог.', 'Мне нужно понимать, что именно мы подписываем.'], hard: ['Без пунктов и сроков это не договорённость.'], warm: ['Мы почти у цели — осталось собрать пункты.'] },
];
function vagueLine(config: Config) {
 const say = gendered(config);
 return config.domain === 'supplier' ? `Пока я не ${say('услышал', 'услышала')} конкретного предложения. Назовите цену, объём, срок и то, что вы готовы гарантировать со своей стороны.` : 'Пока неясно, что именно вы предлагаете. Сформулируйте роль, измеримый результат и срок, после которого мы проверим договорённость.';
}
/**
 * Reply to a free-text move: it reacts to what the player actually said (a greeting, a question, a figure, an offer),
 * keeps the stance of the stage and then asks for what is missing, or opens up about a touched interest.
 */
function freeReply(config: Config, stage: number, c: Choice, trust: number) {
 const current = Math.max(0, Math.min(stage, SESSION_STAGE_COUNT - 1));
 const say = gendered(config);
 const cues = new Set(c.cues ?? []);
 const strong = c.points / STAGE_MAX[current] >= .68;
 const list = interestsFor(config);
 const greeting = current === 0 && cues.has('greeting') ? { Дружелюбный: say('Взаимно, рад встрече.', 'Взаимно, рада встрече.'), Сдержанный: 'Здравствуйте.', Жёсткий: 'Здравствуйте. Давайте по существу.' }[config.tone] : '';
 const asked = cues.has('question') || cues.has('interestQuestion') || cues.has('checkQuestion');
 // A figure the opponent named first (for example the 15% from the opening) is not the player's offer.
 const figure = c.figure && !asked && !normalizeNegotiationText(openingLine(config)).includes(normalizeNegotiationText(c.figure)) ? upperFirst(c.figure) : '';
 if (cues.has('concession')) return [greeting, `${say('Рад', 'Рада')}, что мы сходимся. Но давайте проговорим, на что именно вы соглашаетесь, — иначе потом возникнут разночтения.`].filter(Boolean).join(' ');
 // An empty move («ладно», «не знаю») has nothing to react to; a named figure still gets an answer.
 if (c.intent === 'vague' && !c.gaps?.length) return figure ? `${figure} — это ваша цифра, но за ней пока ничего не стоит. ${config.domain === 'supplier' ? 'Что вы даёте взамен: объём, срок, гарантии?' : 'Что за ней стоит: какая роль, какой результат и к какому сроку?'}` : vagueLine(config);
 if (trust < 25 && c.trust <= 0) return 'В таком тоне договориться сложно. Мне нужны конструктивные условия, иначе остановим обсуждение.';
 const recovering = trust < 25 ? 'Так разговаривать уже можно, но доверие ещё предстоит вернуть.' : '';
 const reveal = c.interests?.length ? list.find(item => item.id === c.interests![0])?.reveal : undefined;
 const hinted = c.hinted ? list.find(item => item.id === c.hinted) : undefined;
 const answers = Boolean(reveal || hinted);
 const reaction = cues.has('checkQuestion') ? (strong ? 'Да, в целом вы поняли верно.' : 'Отчасти верно.')
  : cues.has('interestQuestion') ? (strong ? 'Хороший вопрос.' : answers ? 'Отвечу прямо.' : '')
  : figure ? (current <= 3 ? (strong ? `${figure} можно обсуждать, если остальные условия сложатся.` : `${figure} — это ваша цифра. Мне пока неясно, почему она должна меня устроить.`) : (strong ? `${figure} — принимаю как рабочий ориентир.` : `${figure} мы ещё не согласовали.`))
  : cues.has('exchange') ? (strong ? 'Встречный обмен — это уже разговор по существу.' : 'Обмен я вижу, но условия пока размыты.')
  : cues.has('empathy') ? (strong ? 'Спасибо, что учитываете мою сторону.' : 'Хорошо, что вы видите мою ситуацию.')
  : current > 0 && cues.has('greeting') ? 'И вам спасибо.'
  : '';
 const clue = hinted ? `Многое для меня зависит от темы, которую мы ещё не обсуждали: ${lowerFirst(hinted.label)}.` : undefined;
 const gap = c.gaps?.length ? variant(GAP_LINES[c.gaps[0]], `${c.text}|gap`) : '';
 const detail = reveal ?? clue ?? gap;
 // Tone lines join the pool of weak replies, so a tough or a friendly opponent sounds like one.
 const lines = FREE_CORE[current];
 const toned = strong ? [] : config.tone === 'Жёсткий' ? lines.hard : config.tone === 'Дружелюбный' ? lines.warm : [];
 const stance = variant([...lines[strong ? 'strong' : 'weak'], ...toned], `${c.text}|${stage}`)
  .replace('{рад}', say('рад', 'рада')).replace('{готов}', say('готов', 'готова')).replace('{слышал}', say('слышал', 'слышала')).replace('{Согласен}', say('Согласен', 'Согласна'));
 // The stance is skipped when the reply already reacts and adds something, or when the opponent opens up anyway.
 const core = (reaction && detail) || (reveal && !strong) ? '' : config.tone === 'Жёсткий' && !strong ? `Скажу прямо: ${lowerFirst(stance)}` : stance;
 // On the final stage the stance is the agreement itself, so it closes the reply.
 const closing = current === SESSION_STAGE_COUNT - 1 && strong;
 const final = closing ? stance : core;
 return (closing ? [greeting, recovering, reaction, detail, final] : [greeting, recovering, reaction, core, detail]).filter(Boolean).join(' ');
}
export function respond(config: Config, stage: number, c: Choice, trust: number): string {
 const say = gendered(config);
 if(c.intent==='insult') return `Я не ${say('готов', 'готова')} продолжать разговор в таком тоне. Если вы хотите сохранить возможность сделки, остановимся и вернёмся к уважительному обсуждению конкретных условий.`;
 if(c.intent==='threat') return 'Ультиматум не даёт мне оснований двигаться навстречу. Либо обсудим ограничения и встречные обязательства, либо придётся поставить переговоры на паузу.';
 if(c.intent==='demand') return `Я ${say('услышал', 'услышала')} вашу позицию, но одностороннее требование не решает моих ограничений. Что вы предлагаете взамен и какой риск готовы взять на себя?`;
 if(c.intent==='silence') return 'Пауза затянулась. Если вам нужно время подумать, так и скажите, — но молчание я воспринимаю как отсутствие позиции.';
 if(c.intent==='repair') return `Спасибо, что остановились и вернули разговор в рабочее русло. Я ${say('готов', 'готова')} продолжить, если дальше мы будем обсуждать конкретные условия и интересы обеих сторон.`;
 if(c.freeText) return freeReply(config, stage, c, trust);
 if(c.intent==='vague') return vagueLine(config);
 const prefix = config.tone === 'Жёсткий' ? 'Перейдём к делу. ' : config.tone === 'Дружелюбный' ? 'Спасибо за открытый разговор. ' : '';
 if (trust < 25) return prefix+'В таком тоне договориться сложно. Мне нужны конструктивные условия, иначе остановим обсуждение.';
 const current=Math.max(0,Math.min(stage,SESSION_STAGE_COUNT-1));
 // Each answer option has its own reply: a strong move opens the deal, a weak one costs leverage, pressure hardens the opponent.
 const branch=c.trust<0?'hostile':c.points>=15?'strong':'weak';
 const line=fillTemplate((usesStory(config)?REPLIES[config.domain]:GENERIC_REPLIES)[current][branch],config);
 return (branch==='hostile'?'':prefix)+line+(current===2&&branch==='strong'?` Мой приоритет: ${lowerFirst(config.goal.trim().replace(/[.!]+$/,''))}.`:'');
}
type ReplyBranches={strong:string;weak:string;hostile:string};
/** Opponent replies for a custom topic: gender-neutral, with {topic}, {role} and {goal}. */
const GENERIC_REPLIES:ReplyBranches[]=[
 {strong:'Спасибо, что начали с этого. Для меня важно {goal}, и мне интересно найти вариант, который устроит обе стороны.',weak:'К цифрам рано. Сначала разберёмся, что на самом деле стоит за вопросом «{topic}».',hostile:'Уйти — ваше право, но это не ускорит решение. Если хотите договориться, давайте без ультиматумов.'},
 {strong:'Да, так и есть. Кроме этого, мне важно понимать сроки, ресурсы и то, какие риски остаются на моей стороне.',weak:'Это ваша позиция. У меня другая, и пока вы не спросили почему, сблизиться сложно.',hostile:'Если позиция окончательная, обсуждать нечего. Тогда и моя позиция не изменится.'},
 {strong:'Хороший вопрос. Больше всего на моё решение влияют риски и сроки: если их снять, у нас появится пространство для договорённости.',weak:'Мне важно, чтобы решение было обоснованным. Конкретнее скажу, когда пойму, что вы готовы предложить.',hostile:'Мои ограничения — часть задачи, а не помеха. Если их игнорировать, договориться не получится.'},
 {strong:'Такой пакет уже выглядит сбалансированно. Уточним, как вы гарантируете свою часть и что будет, если что-то пойдёт не по плану.',weak:'Пока я вижу уступку без встречных обязательств. Что вы готовы дать взамен?',hostile:'Последнее предложение без обмена — это не переговоры. На таких условиях согласия не будет.'},
 {strong:'Контрольная точка и понятный критерий снимают моё главное опасение. С этим можно двигаться дальше.',weak:'Главное опасение остаётся: результат нельзя проверить. Нужен механизм, а не обещание.',hostile:'Я не ищу повод — я называю реальный риск. Если он вам неинтересен, закрывать договорённость не на чем.'},
 {strong:'Договорились. Жду протокол: подтвержу пункты и запущу согласование со своей стороны.',weak:'В целом да, но без конкретных пунктов и сроков это легко затянется.',hostile:'Стоп, согласия по всем пунктам пока нет. Давайте сначала сверим их.'},
];
const REPLIES:Record<Domain,ReplyBranches[]>={
 supplier:[
  {strong:'Я тоже заинтересован сохранить отношения. Но рост себестоимости реален, поэтому нам понадобится предметный обмен условиями.',weak:'Скидку? Мы только что сказали, что издержки выросли. Прежде чем торговаться, давайте поймём, что вообще можно сохранить.',hostile:'Уйти — ваше право, но переход к другому поставщику тоже стоит денег и времени. Если хотите договориться, давайте без ультиматумов.'},
  {strong:'Да, позиции обозначены верно. Кроме цены для нас важны прогнозируемая загрузка, сроки оплаты и защита от резкого падения объёма.',weak:'Пять процентов — это ваша позиция. Наша — пятнадцать, и пока вы не спросили, почему, торговаться не о чем.',hostile:'Если позиция окончательная, обсуждать нечего. Но тогда и мы остаёмся при 15%.'},
  {strong:'Гарантированный объём действительно снижает риск. Если он будет закреплён, мы сможем обсуждать меньший рост и более длинный горизонт.',weak:'Для нас важны загрузка производства и предсказуемые оплаты. Конкретнее скажу, когда пойму, что вы готовы обсуждать.',hostile:'Наши издержки — это и ваша цена. Если вам безразличны наши ограничения, нам сложно учитывать ваши.'},
  {strong:'Такой пакет уже выглядит сбалансированнее. Мне нужно понять, как вы гарантируете объём и что произойдёт при отклонении от прогноза.',weak:'Пока я вижу уступку только с нашей стороны. Нужны встречные обязательства по объёму, сроку или оплате.',hostile:'Последнее предложение без обмена — это не переговоры. Тогда мы остаёмся при 15%.'},
  {strong:'Коридор по объёму снимает основное возражение. При отклонении можно включить пересмотр, не разрушая весь контракт.',weak:'Риск недозагрузки всё ещё остаётся на нас. Без механизма пересмотра я не смогу согласовать цену.',hostile:'Я не ищу повод, я называю реальный риск. Если он вам неинтересен, закрывать сделку не на чем.'},
  {strong:'Готов сверить формулировки и назначить ответственных. Если цифры совпадут с тем, что обсудили, вынесу проект на согласование в пятницу.',weak:'По почте можно, но без цифр в протоколе с первого числа начнёт действовать новая цена.',hostile:'Подождите, я ещё ничего не подписывал. Давайте сначала сверим условия письменно.'},
 ],
 career:[
  {strong:'Я готова обсудить ваш следующий шаг. Мне важно связать новую роль с задачами команды и понятным результатом.',weak:'Сумму назвать пока не могу. Сначала хочу понять, о какой ответственности мы говорим.',hostile:'Угроза уходом не делает бюджет больше. Давайте обсуждать результаты, а не ультиматумы.'},
  {strong:'Сейчас возможности бюджета ограничены, но вопрос не только в деньгах. Нужен план новой ответственности и передача текущих задач.',weak:'Я услышала ваши цифры. Но вы не спросили, что ограничивает меня, — без этого я могу только отказать.',hostile:'Если вам нужен только мой ответ «да», то сейчас он «нет».'},
  {strong:'Для обоснования нужны измеримые результаты, зона решений и срок проверки. Мой приоритет — не перегрузить команду и удержать темп.',weak:'Мне важны результаты команды и прозрачность решений. Если конкретизируете, о каких задачах речь, будет проще.',hostile:'Ограничения бюджета — это и ваша реальность, раз вы в этой команде. Без их учёта разговора не получится.'},
  {strong:'Пилот и заранее согласованные KPI выглядят реалистично. Давайте разберём, какие ресурсы вам нужны и кто примет текущие задачи.',weak:'Мне пока недостаточно оснований для изменения роли. Нужна связь между результатом, ответственностью и сроком пересмотра.',hostile:'Если обсуждать больше нечего, мне остаётся только отказать. Предлагаю всё же вернуться к вариантам.'},
  {strong:'Трёхмесячный период снижает риск для бюджета. Если критерии прозрачны, я смогу защитить решение перед руководством.',weak:'Главное возражение остаётся: результат нельзя проверить. Без критериев и срока я не смогу обещать пересмотр.',hostile:'Я не ищу повод. Мне нужно защитить решение перед руководством, а для этого нужны критерии.'},
  {strong:'Давайте зафиксируем KPI, ресурсы и дату контрольной встречи. После письма я подтвержу договорённости и запущу согласование.',weak:'В целом — да. Но без конкретных KPI и даты это легко затянется до следующего цикла пересмотра.',hostile:'Я пока ни с чем не соглашалась. Давайте сначала запишем, что именно мы обсудили.'},
 ],
 team:[
  {strong:'Спасибо, что слышите. Я не против сроков как таковых — я против того, чтобы команда снова работала ночами.',weak:'Дело не в днях. Вы даже не спросили, почему команда против.',hostile:'Ищите. Только за две недели новый человек даже код не успеет прочитать. Давайте разговаривать нормально.'},
  {strong:'Да, всё так. Если речь о ключевой части — это уже другой разговор. Весь релиз за две недели нереален.',weak:'Это ваша позиция. Моя — команда не работает ночами. Пока мы просто повторяем свои требования.',hostile:'Тогда и я отвечу окончательно: ночных смен не будет.'},
  {strong:'Больше всего выматывают ночные деплои и правки в последний момент. Если их убрать и зафиксировать объём, команда потянет.',weak:'Важно, чтобы нас перестали дёргать правками. Но что конкретно вы можете изменить?',hostile:'Это не внутренние проблемы, это люди, которые делают ваш релиз.'},
  {strong:'Три функции, стажёр на тестах и отгулы — это уже похоже на план. Но кто остановит клиента, если он захочет добавить ещё?',weak:'Обещание «что-нибудь потом» команда слышала уже трижды. Нужно конкретное условие.',hostile:'Тогда и мне обсуждать нечего. Команда работает по обычному графику.'},
  {strong:'Заморозка кода и понятный критерий переноса снимают мой главный страх. С этим я могу идти к команде.',weak:'Больше всего сомнений в том, что объём снова вырастет в последний момент. Как мы это предотвратим?',hostile:'Я не ищу повод. Я отвечаю за качество и выпускать сырой релиз не буду.'},
  {strong:'Договорились. Жду план сегодня — завтра на стендапе объявлю его команде.',weak:'«Детали по почте» команда уже слышала. Без конкретного плана никто не поверит, что переработок не будет.',hostile:'Стоп, я согласился обсуждать, а не подписываться под всем. Давайте сверим пункты.'},
 ],
};
/** Harder levels make every hostile move costlier: trust drops faster and tension rises faster. */
const DIFFICULTY_PENALTY:Record<Config['difficulty'],number>={Базовый:1,Продвинутый:1.15,Эксперт:1.3};
export function outcome(config: Config, turns: Turn[], requiredTurns = SESSION_STAGE_COUNT) {
 const count = Math.max(1, Math.min(requiredTurns, SESSION_STAGE_COUNT));
 const maximum = Array.from({length:count},(_,stage)=>Math.max(...choices(config.domain,stage).map(item=>item.points))).reduce((sum,value)=>sum+value,0);
 const raw = turns.slice(0,count).reduce((sum,turn)=>sum+turn.points,0);
 const score = Math.max(0,Math.min(100,Math.round(raw/maximum*100)));
 const penalty = DIFFICULTY_PENALTY[config.difficulty];
 const trust = Math.max(0, Math.min(100,50+turns.reduce((s,t)=>s+(t.trust<0?Math.round(t.trust*penalty):t.trust),0)));
 const collapsed=tension(config,turns)>=100;
 return {score,trust,collapsed,won:!collapsed&&turns.length===count&&score>=threshold(config)&&trust>=40};
}

/** Emotional pressure is distinct from trust: concessions do not resolve uncertainty. */
export function tension(config: Config, turns: Turn[]) {
 const baseline = {Дружелюбный: 24, Сдержанный: 36, Жёсткий: 48}[config.tone]
   + {Базовый: 0, Продвинутый: 5, Эксперт: 10}[config.difficulty];
 return turns.reduce((value, turn) => {
   const delta = typeof turn.tension==='number' ? turn.tension : turn.trust < 0 ? Math.ceil(Math.abs(turn.trust) * 1.4)
     : turn.points >= 19 ? -14 : turn.points >= 12 ? -5 : 5;
   return Math.max(5, Math.min(100, value + (delta > 0 ? Math.round(delta * DIFFICULTY_PENALTY[config.difficulty]) : delta)));
 }, baseline);
}
export function tensionState(value: number) {
 if (value >= 70) return {label: 'На грани срыва', hint: 'Снизьте давление. Признайте интерес собеседника и задайте открытый вопрос.', color: '#d56d59', level: 'high'};
 if (value >= 45) return {label: 'Осторожный диалог', hint: 'Добавьте конкретики и покажите, что учитываете обе стороны.', color: '#ba9552', level: 'medium'};
 return {label: 'Есть контакт', hint: 'Собеседник открыт к обсуждению. Продолжайте искать взаимную выгоду.', color: '#76a68a', level: 'low'};
}
