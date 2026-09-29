import { Config, discoveredInterests, figureOf, finale, interestsFor, outcome, stages, stageMaximum, tension, threshold, Turn } from './engine';

/**
 * What the negotiation produced, kept apart from how well the player played: an agreement can still be
 * too expensive (a concession for nothing, lost trust, a deal without an owner or a date).
 */
export type DealStatus = 'agreement' | 'partial' | 'none' | 'early' | 'collapsed';
export type DealTerm = { kind: 'figure' | 'condition' | 'owner' | 'document'; text: string; at?: number };
export type DealCost = { text: string; quote?: string; at?: number };
export type DealSummary = { status: DealStatus; label: string; terms: DealTerm[]; interests: string[]; costs: DealCost[]; next: string };

const STATUS_LABEL: Record<DealStatus, string> = {
  agreement: 'Договорённость достигнута',
  partial: 'Частичная договорённость',
  none: 'Договорённость не достигнута',
  early: 'Решение отложено: встреча прервана',
  collapsed: 'Переговоры сорваны',
};
const CONDITION = /(?:^|[\s,(])(?:если|при условии|в случае|в обмен|взамен|при отклонении|по итогам)(?=[\s,])/iu;
const OWNER = /(?:отправлю|отправим|подготовлю|подготовим|пришлю|пришлём|пришлем|ответственн|беру на себя|берём на себя|берем на себя|до (?:понедельник|вторник|сред|четверг|пятниц|конца)|сегодня|завтра)/iu;
const DOCUMENT = /(?:протокол|письменн|письмо|договор|документ)/iu;
const HOSTILE = new Set(['insult', 'threat', 'demand', 'silence']);
// «KPI по трудоустройству» keeps its acronym, «Служебное жильё в Елабуге» keeps the city.
export const lowerFirst = (text: string) => !text || /^\p{Lu}{2}/u.test(text) ? text : text[0].toLowerCase() + text.slice(1);
const clip = (text: string, limit = 150) => text.length > limit ? `${text.slice(0, limit - 1).replace(/\s+\S*$/u, '')}…` : text;

/** Sentences of the player's accepted offers and commitments that name terms: figures, conditions, owners, documents. */
function termsOf(turns: Turn[]): DealTerm[] {
  const terms: DealTerm[] = [];
  const seen = new Set<string>();
  turns.forEach((turn, index) => {
    // Terms live in the package, the objection and the closing; hostile or distrusted moves are not part of a deal.
    if (index < 3 || turn.trust < 0 || HOSTILE.has(turn.intent ?? '')) return;
    for (const raw of turn.text.split(/(?<=[.!?;])\s+/u)) {
      const trimmed = raw.trim().replace(/^[—–-]\s*/u, '');
      const sentence = trimmed ? trimmed[0].toUpperCase() + trimmed.slice(1) : trimmed;
      const kind: DealTerm['kind'] | null = OWNER.test(sentence) ? 'owner' : CONDITION.test(sentence) ? 'condition' : DOCUMENT.test(sentence) ? 'document' : figureOf(sentence) ? 'figure' : null;
      const key = sentence.toLowerCase().replace(/ё/g, 'е').replace(/[^а-яa-z0-9%]+/giu, ' ').trim();
      if (!kind || key.split(' ').length < 3 || seen.has(key)) continue;
      seen.add(key);
      terms.push({ kind, text: clip(sentence), at: turn.at });
    }
  });
  // The closing restates the deal, so the latest terms are the most accurate ones.
  return terms.slice(-5);
}

/** What the result cost: concessions without exchange, pressure that burnt trust, what was left unexplored or unfixed. */
function costsOf(config: Config, turns: Turn[], stageTotal: number): DealCost[] {
  const costs: DealCost[] = [];
  turns.forEach((turn, index) => {
    const unconditional = turn.skill === 'Односторонний компромисс' || turn.skill === 'Безусловная уступка' || (index >= 3 && Boolean(turn.gaps?.includes('exchange')) && Boolean(turn.cues?.includes('proposal')));
    if (unconditional) costs.push({ text: `Уступка без встречного условия на этапе «${stages[index]}»`, quote: clip(turn.text, 110), at: turn.at });
    else if (turn.intent === 'silence') costs.push({ text: `Пауза под давлением на этапе «${stages[index]}»: собеседник воспринял её как отсутствие позиции`, at: turn.at });
    else if (turn.trust < 0) {
      const before = tension(config, turns.slice(0, index));
      const after = tension(config, turns.slice(0, index + 1));
      costs.push({ text: `Давление стоило доверия: ${turn.trust} п., напряжённость ${before}% → ${after}%`, quote: clip(turn.text, 110), at: turn.at });
    }
  });
  const known = discoveredInterests(turns);
  const missed = interestsFor(config).filter(item => !known.has(item.id)).slice(0, 2);
  for (const item of missed) costs.push({ text: `Не выяснено, что важно собеседнику: ${lowerFirst(item.label)}. На этом можно было построить обмен.` });
  const closing = turns[stageTotal - 1];
  if (closing && (closing.points / stageMaximum(stageTotal - 1) < .7 || closing.gaps?.some(gap => gap === 'owner' || gap === 'written' || gap === 'summary')))
    costs.push({ text: 'Договорённость без ответственного, срока или письменной фиксации легко «расползётся».', quote: clip(closing.text, 110), at: closing.at });
  return costs;
}

export function dealSummary(config: Config, turns: Turn[], stageTotal: number): DealSummary {
  const result = outcome(config, turns, stageTotal);
  const completed = turns.length >= stageTotal;
  const status: DealStatus = result.collapsed ? 'collapsed' : result.won ? 'agreement' : !completed ? 'early' : result.score >= threshold(config) - 15 && result.trust >= 40 ? 'partial' : 'none';
  const known = discoveredInterests(turns);
  return {
    status, label: STATUS_LABEL[status],
    terms: status === 'collapsed' ? [] : termsOf(turns),
    interests: interestsFor(config).filter(item => known.has(item.id)).map(item => item.label),
    costs: costsOf(config, turns, stageTotal),
    next: finale(config, result, completed),
  };
}
