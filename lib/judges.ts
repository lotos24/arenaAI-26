import { Config, discoveredInterests, interestsFor, outcome, stageMaximum, tension, Turn } from './engine';
import { lowerFirst } from './deal';

/**
 * Three judges in the spirit of Vladimir Tarasov's management duels. Each asks one question and backs the
 * verdict with episodes: the player's words, the time, and what changed after them (tension, trust, interests).
 * Everything is computed from the turns, so the verdict is instant, repeatable and explainable.
 */
export type JudgeId = 'employee' | 'delegate' | 'owner';
export type Episode = { stage: number; at?: number; quote: string; effect: string };
export type JudgeVerdict = { id: JudgeId; title: string; question: string; focus: string; chosen: boolean; strong?: Episode; weak?: Episode; comment: string };

const clip = (text: string, limit = 140) => text.length > limit ? `${text.slice(0, limit - 1).replace(/\s+\S*$/u, '')}…` : text;
const firstSentence = (text: string) => clip(text.match(/^[^.!?]+[.!?]?/u)?.[0]?.trim() ?? text, 110);
const quality = (turn: Turn, stage: number) => turn.points / stageMaximum(stage);
const unconditional = (turn: Turn, stage: number) => turn.skill === 'Односторонний компромисс' || turn.skill === 'Безусловная уступка' || (stage >= 3 && Boolean(turn.gaps?.includes('exchange')) && Boolean(turn.cues?.includes('proposal')));

/** Action → change of the situation: tension, trust and interests before and after the move, and the opponent's answer. */
export function episodeOf(config: Config, turns: Turn[], stage: number): Episode {
  const turn = turns[stage];
  const before = tension(config, turns.slice(0, stage));
  const after = tension(config, turns.slice(0, stage + 1));
  const labels = (turn.interests ?? []).map(id => interestsFor(config).find(item => item.id === id)?.label).filter((label): label is string => Boolean(label)).map(lowerFirst);
  const changes = [
    after !== before ? `напряжённость ${before}% → ${after}%` : '',
    turn.trust ? `доверие ${turn.trust > 0 ? '+' : ''}${turn.trust}` : '',
    labels.length ? `раскрыт интерес: ${labels.join(', ')}` : '',
  ].filter(Boolean).join(', ');
  const answer = turn.reply ? `Собеседник: «${firstSentence(turn.reply)}»` : '';
  return { stage, at: turn.at, quote: clip(turn.text), effect: [changes ? `${changes[0].toUpperCase()}${changes.slice(1)}.` : '', answer].filter(Boolean).join(' ') };
}

/** Index of the best (highest score) and the worst (lowest score, if below zero) moves by a judge's own measure. */
function pick(turns: Turn[], score: (turn: Turn, stage: number) => number, stagesToWatch: (stage: number) => boolean = () => true) {
  let best = -1, worst = -1, high = 0, low = 0;
  turns.forEach((turn, stage) => {
    if (!stagesToWatch(stage)) return;
    const value = score(turn, stage);
    if (value > high) { high = value; best = stage; }
    if (value < low) { low = value; worst = stage; }
  });
  return { best, worst };
}

export function judgeSession(config: Config, turns: Turn[], stageTotal: number): JudgeVerdict[] {
  const result = outcome(config, turns, stageTotal);
  const finalTension = tension(config, turns);
  const known = discoveredInterests(turns).size;
  const total = interestsFor(config).length;
  const complete = turns.length >= stageTotal;
  const episode = (stage: number) => stage >= 0 ? episodeOf(config, turns, stage) : undefined;

  // People and relations: respect, reliability, keeping the working contact under pressure.
  const insulted = turns.some(turn => turn.intent === 'insult');
  const people = pick(turns, turn => turn.trust + (turn.cues?.includes('empathy') ? 3 : 0) + (turn.intent === 'repair' ? 4 : 0) + (turn.intent === 'insult' ? -10 : 0));
  const employee = !insulted && result.trust >= 55 && finalTension < 70 && turns.length >= 3;
  const slipped = turns.some(turn => turn.trust < 0);
  const repaired = turns.some(turn => turn.intent === 'repair');

  // Moving to the goal and managing the other side: interests found, questions, a result that holds.
  const goal = pick(turns, (turn, stage) => quality(turn, stage) + .4 * (turn.interests?.length ?? 0) + (turn.cues?.includes('interestQuestion') ? .2 : 0) - (turn.trust < 0 ? .6 : 0) - .45, stage => stage <= 3);
  const delegate = (result.won || (complete && result.score >= 60)) && known >= Math.min(2, total);

  // Decisions and risks: no concession for nothing, a risk mechanism, a closing with an owner and a date.
  const conceded = turns.some((turn, stage) => unconditional(turn, stage));
  const risk = pick(turns, (turn, stage) => quality(turn, stage) - (unconditional(turn, stage) ? .8 : 0) - (turn.trust < 0 ? .5 : 0) - .55, stage => stage >= 3);
  const closing = turns[stageTotal - 1];
  const owner = complete && !conceded && [3, 4].every(stage => turns[stage] && quality(turns[stage], stage) >= .6) && Boolean(closing) && quality(closing, stageTotal - 1) >= .65;

  return [
    {
      id: 'employee', title: 'Нанимающийся на работу', question: 'Пошёл бы я работать под руководством этого человека?', focus: 'люди, отношения, надёжность, твёрдость без грубости',
      chosen: employee, strong: episode(people.best), weak: episode(people.worst),
      comment: employee ? (slipped ? (repaired ? 'Да, с оговоркой: вы сорвались на давление, но признали это и вернули рабочий контакт — так поступает надёжный руководитель.' : 'Да, с оговоркой: контакт вы сохранили, но давление в одном из ходов команда бы запомнила.') : 'Да: вы держали уважение к собеседнику и сохраняли рабочий контакт даже там, где разговор становился жёстким.')
        : insulted ? 'Нет: оскорбление показывает, как вы поведёте себя с командой под давлением.'
        : finalTension >= 70 ? 'Пока нет: разговор закончился на грани срыва, а такой руководитель выматывает команду.'
        : 'Пока нет: давления было больше, чем внимания к людям, и доверие к вам не выросло.',
    },
    {
      id: 'delegate', title: 'Отправляющий на переговоры', question: 'Отправил бы я этого человека вместо себя на сложные переговоры?', focus: 'движение к цели, управление разговором, картина мира собеседника',
      chosen: delegate, strong: episode(goal.best), weak: episode(goal.worst),
      comment: delegate ? `Да: вы выясняли, что стоит за позицией собеседника (раскрыто интересов: ${known}/${total}), и довели разговор до результата.`
        : known < Math.min(2, total) ? `Пока нет: вы мало узнали о том, что на самом деле нужно собеседнику (раскрыто ${known}/${total}), поэтому торговались позициями.`
        : 'Пока нет: интересы вы увидели, но не превратили их в договорённость.',
    },
    {
      id: 'owner', title: 'Доверяющий собственность', question: 'Доверил бы я этому человеку свои деньги, компанию или другой значимый ресурс?', focus: 'качество решений, риски, ответственность за последствия',
      chosen: owner, strong: episode(risk.best), weak: episode(risk.worst),
      comment: owner ? 'Да: каждая уступка у вас связана со встречным условием, риск закрыт механизмом, а итог зафиксирован с ответственным и сроком.'
        : conceded ? 'Пока нет: вы отдали уступку без встречного условия — с моими ресурсами так рисковать нельзя.'
        : !complete ? 'Пока нет: решение не доведено до фиксации, а значит, ответственность ни на ком.'
        : 'Пока нет: риски собеседника и условия пересмотра проработаны не до конца, итог уязвим.',
    },
  ];
}
