import { choices, Choice, Config, discoveredInterests, finale, interestsFor, outcome, scenarios, sessionStageCount, stages, TechniqueId, tension, Turn } from './engine';

/** Negotiation methods behind every move, so players learn to name what they do. */
export type Technique = { id: TechniqueId; label: string; kind: 'method' | 'risk' };
export const TECHNIQUES: Record<TechniqueId, Technique> = {
  empathy: { id: 'empathy', label: 'Эмпатия и контакт', kind: 'method' },
  spinSituation: { id: 'spinSituation', label: 'SPIN: Ситуация', kind: 'method' },
  spinProblem: { id: 'spinProblem', label: 'SPIN: Исследование проблемы', kind: 'method' },
  harvardInterests: { id: 'harvardInterests', label: 'Гарвард: Интересы', kind: 'method' },
  harvardPackage: { id: 'harvardPackage', label: 'Гарвард: Пакетный обмен', kind: 'method' },
  harvardCriteria: { id: 'harvardCriteria', label: 'Гарвард: Объективные критерии', kind: 'method' },
  closing: { id: 'closing', label: 'Фиксация договорённости', kind: 'method' },
  batna: { id: 'batna', label: 'BATNA: Опора на альтернативу', kind: 'method' },
  batnaThreat: { id: 'batnaThreat', label: 'BATNA как угроза', kind: 'risk' },
  positional: { id: 'positional', label: 'Позиционный торг', kind: 'risk' },
  pressure: { id: 'pressure', label: 'Давление', kind: 'risk' },
  concession: { id: 'concession', label: 'Уступка без обмена', kind: 'risk' },
  vague: { id: 'vague', label: 'Без конкретики', kind: 'risk' },
};
const SKILL_TECHNIQUE: Record<string, TechniqueId> = {
  'Контакт': 'empathy', 'Восстановление контакта': 'empathy',
  'Рамка разговора': 'spinSituation',
  'Интересы': 'harvardInterests',
  'Уточнение': 'spinProblem', 'Диагностика возражения': 'spinProblem',
  'Взаимный обмен': 'harvardPackage',
  'Работа с риском': 'harvardCriteria', 'Работа с возражением': 'harvardCriteria',
  'Фиксация': 'closing',
  'Угроза уходом': 'batnaThreat',
  'Торг без контакта': 'positional', 'Только своя позиция': 'positional',
  'Давление': 'pressure', 'Ультиматум': 'pressure', 'Обесценивание': 'pressure', 'Оскорбление': 'pressure', 'Допущение': 'pressure', 'Одностороннее требование': 'pressure',
  'Односторонний компромисс': 'concession', 'Безусловная уступка': 'concession',
  'Размытая фиксация': 'vague', 'Без конкретики': 'vague', 'Молчание под давлением': 'vague',
};
export function techniqueFor(c: Pick<Choice, 'skill' | 'intent' | 'technique'>): Technique | null {
  const id = c.technique ?? SKILL_TECHNIQUE[c.skill]
    ?? (c.intent === 'insult' || c.intent === 'threat' || c.intent === 'demand' ? 'pressure'
      : c.intent === 'vague' || c.intent === 'silence' ? 'vague' : c.intent === 'repair' ? 'empathy' : undefined);
  return id ? TECHNIQUES[id] : null;
}

function isPersonalAttack(turn: Turn) {
  const text = turn.text.toLowerCase().replace(/ё/g, 'е');
  return turn.intent === 'insult' || turn.skill === 'Оскорбление' || turn.skill === 'Обесценивание' || /не касаются|ищете повод|несерьезно/.test(text);
}

export type AssessmentStatus = 'yes' | 'partial' | 'no';
export type HarvardItem = { id: 'people' | 'interests' | 'mutual' | 'criteria'; label: string; status: AssessmentStatus; detail: string };
/** Four principles of the Harvard method, judged from the moves of one session. */
export function harvardAssessment(config: Config, turns: Turn[]): HarvardItem[] {
  const attacks = turns.filter(isPersonalAttack).length;
  const repaired = turns.some(turn => turn.intent === 'repair');
  const known = discoveredInterests(turns).size;
  const total = interestsFor(config).length;
  const positional = turns.filter(turn => techniqueFor(turn)?.id === 'positional').length;
  const best = (ids: TechniqueId[]) => Math.max(0, ...turns.filter(turn => ids.includes(techniqueFor(turn)?.id as TechniqueId)).map(turn => turn.points));
  const packagePoints = best(['harvardPackage']);
  const criteriaPoints = best(['harvardCriteria', 'closing']);
  const hasPackage = turns.some(turn => techniqueFor(turn)?.id === 'harvardPackage');
  const hasCriteria = turns.some(turn => ['harvardCriteria', 'closing'].includes(techniqueFor(turn)?.id ?? ''));
  return [
    { id: 'people', label: 'Отделение человека от проблемы', status: attacks === 0 ? 'yes' : attacks === 1 && repaired ? 'partial' : 'no',
      detail: attacks === 0 ? 'Вы спорили с условиями, а не с человеком.' : `Ходов, задевающих собеседника лично: ${attacks}.${repaired ? ' Контакт удалось восстановить.' : ' Признайте срыв и верните разговор к условиям.'}` },
    { id: 'interests', label: 'Фокус на интересах, а не позициях', status: known >= 2 ? 'yes' : known === 1 ? 'partial' : 'no',
      detail: `Раскрыто интересов: ${known} из ${total}.${positional ? ` Позиционных ходов: ${positional}.` : ''}` },
    { id: 'mutual', label: 'Взаимная выгода', status: packagePoints >= 15 ? 'yes' : hasPackage ? 'partial' : 'no',
      detail: packagePoints >= 15 ? 'Предложение связало уступки со встречной ценностью.' : hasPackage ? 'Обмен предложен, но без чёткой встречной ценности.' : 'Пакет «даю — прошу взамен» так и не прозвучал.' },
    { id: 'criteria', label: 'Объективные критерии', status: criteriaPoints >= 15 ? 'yes' : hasCriteria ? 'partial' : 'no',
      detail: criteriaPoints >= 15 ? 'Договорённость опирается на проверяемые критерии: KPI, коридоры, сроки.' : hasCriteria ? 'Критерии названы, но не доведены до измеримых.' : 'Нет измеримых критериев: коридора, KPI, даты пересмотра.' },
  ];
}

type SessionLike = { config: Config; turns: Turn[]; started: number; ended?: number; stageCount?: number };

export type Competency = { id: string; label: string; value: number | null; level: string; hint: string };
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
export function competencyLevel(value: number) {
  return value >= 80 ? 'Уверенно' : value >= 60 ? 'Хорошо' : value >= 40 ? 'Требует практики' : 'Начальный уровень';
}
/** Five negotiation competencies (0–100%) derived from finished sessions. */
export function competencyProfile(history: SessionLike[]) {
  const finished = history.filter(session => session.ended && session.turns.length);
  const empathy = average(finished.map(session => clamp01((session.turns[0]?.points ?? 0) / 17) * (session.turns.some(isPersonalAttack) ? .5 : 1)));
  const spin = average(finished.map(session => {
    const questions = session.turns.filter(turn => turn.intent === 'question' || ['harvardInterests', 'spinProblem', 'spinSituation'].includes(techniqueFor(turn)?.id ?? '')).length;
    return .6 * discoveredInterests(session.turns).size / interestsFor(session.config).length + .4 * clamp01(questions / 2);
  }));
  const packages = average(finished.filter(session => session.turns[3]).map(session => clamp01(session.turns[3].points / 19)));
  const stress = average(finished.map(session => {
    const calm = session.turns.filter((_, index) => tension(session.config, session.turns.slice(0, index + 1)) < 70).length;
    const repairs = session.turns.filter(turn => turn.intent === 'repair').length;
    const collapsed = outcome(session.config, session.turns, sessionStageCount(session)).collapsed;
    return clamp01(calm / session.turns.length + .15 * repairs) * (collapsed ? .5 : 1);
  }));
  const closing = average(finished.filter(session => session.turns[5]).map(session => clamp01(session.turns[5].points / 18)));
  const item = (id: string, label: string, value: number | null, hint: string): Competency => {
    const percent = value === null ? null : Math.round(value * 100);
    return { id, label, value: percent, level: percent === null ? 'Нет данных' : competencyLevel(percent), hint };
  };
  return {
    sessions: finished.length,
    items: [
      item('empathy', 'Эмпатия и контакт', empathy, 'Первый этап без давления: признать позицию и назвать общую цель.'),
      item('spin', 'Исследование интересов (SPIN)', spin, 'Открытые вопросы и раскрытые скрытые интересы собеседника.'),
      item('package', 'Пакетные решения (Гарвард)', packages, 'Четвёртый этап: несколько условий и встречный обмен.'),
      item('stress', 'Стресс-менеджмент', stress, 'Напряжённость ниже 70% и восстановление контакта после срыва.'),
      item('closing', 'Фиксация договорённостей', closing, 'Шестой этап: условия, ответственный и срок.'),
    ],
  };
}

const STATUS_MARK: Record<AssessmentStatus, string> = { yes: '✓', partial: '~', no: '✗' };
/** Plain-text summary of one session that a learner can paste into notes or send to a coach. */
export function sessionMemo(session: SessionLike) {
  const { config, turns } = session;
  const stageTotal = sessionStageCount(session);
  const result = outcome(config, turns, stageTotal);
  const known = discoveredInterests(turns);
  const verdict = result.collapsed ? 'Срыв переговоров (напряжённость 100%)' : result.won ? 'Договорённость достигнута' : turns.length < stageTotal ? 'Практика остановлена досрочно' : 'Без договорённости';
  const strengths = turns.map((turn, index) => ({ turn, index })).filter(({ turn }) => turn.points >= 15);
  const growth = turns.map((turn, index) => ({ turn, index })).filter(({ turn }) => turn.points < 15);
  const label = (turn: Turn) => { const technique = techniqueFor(turn); return technique ? `${turn.skill} (${technique.label})` : turn.skill; };
  return [
    `Памятка по переговорам — «${config.topic}»`,
    `Дата: ${new Date(session.ended ?? session.started).toLocaleDateString('ru-RU')} · ${scenarios[config.domain].label} · ${config.difficulty} · тон: ${config.tone.toLowerCase()}`,
    `Итог: ${verdict}. ${finale(config, result, turns.length >= stageTotal)}`,
    `Результат: ${result.score}/100 · Доверие: ${result.trust}% · Напряжённость: ${tension(config, turns)}% · Этапов: ${turns.length}/${stageTotal}`,
    '',
    `Скрытые интересы собеседника (${known.size}/${interestsFor(config).length}):`,
    ...interestsFor(config).map(item => known.has(item.id) ? `✓ ${item.label}` : `✗ ${item.label} — ${item.hint}`),
    '',
    'Оценка по Гарвардскому методу:',
    ...harvardAssessment(config, turns).map(item => `${STATUS_MARK[item.status]} ${item.label}: ${item.detail}`),
    '',
    'Сильные стороны:',
    ...(strengths.length ? strengths.map(({ turn, index }) => `• Этап «${stages[index]}»: ${label(turn)}.`) : ['• Пока нет ходов на высокий балл — начните с признания позиции собеседника.']),
    '',
    'Что улучшить:',
    ...(growth.length ? growth.map(({ turn, index }) => `• Этап «${stages[index]}»: ${turn.feedback} Попробуйте: «${choices(config, index)[0].text}»`) : ['• Все ходы сильные — повторите сценарий на уровне сложности выше.']),
  ].join('\n');
}

/** Coach hints per stage: the method to apply, never the ready-made answer. */
export const COACH_HINTS: Array<{ method: string; text: string }> = [
  { method: 'Эмпатия и контакт', text: 'Признайте позицию собеседника своими словами и назовите общую цель. К цифрам пока рано.' },
  { method: 'SPIN: Ситуация', text: 'Сверьте позиции обеих сторон и уточните рамки: что для собеседника приемлемо, а что нет.' },
  { method: 'SPIN: Проблема · Гарвард: интересы', text: 'Задайте открытый вопрос о причинах и ограничениях («что сильнее всего влияет…?»). Ищите интерес за позицией.' },
  { method: 'Гарвард: пакетный обмен', text: 'Свяжите два-три условия: что вы даёте и что просите взамен. Уступка без встречной ценности ослабляет позицию.' },
  { method: 'Гарвард: объективные критерии', text: 'Назовите риск собеседника и предложите проверяемый механизм: пилот, коридор, KPI или дату пересмотра.' },
  { method: 'Фиксация договорённости', text: 'Перечислите условия, ответственного и срок, затем проверьте согласие, прежде чем объявлять итог.' },
];
