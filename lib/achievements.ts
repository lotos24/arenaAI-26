import { Config, discoveredInterests, interestsFor, outcome, sessionStageCount, tension, Turn } from './engine';

export type AchievementId = 'harvard-diplomat' | 'steel-nerves' | 'pressure-decision' | 'win-win' | 'live-voice' | 'de-escalation';
export type Achievement = { id: AchievementId; title: string; description: string };

/** Awards for skills, not for grinding: each one marks a concrete negotiation behaviour. */
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'harvard-diplomat', title: 'Гарвардский дипломат', description: 'Раскрыть все скрытые интересы собеседника за одну сессию.' },
  { id: 'steel-nerves', title: 'Стальные нервы', description: 'Договориться на сложности «Эксперт» с жёстким собеседником.' },
  { id: 'pressure-decision', title: 'Решение под прессингом', description: 'Дать сильный ответ менее чем за 5 секунд до конца таймера.' },
  { id: 'win-win', title: 'Win-Win Мастер', description: 'Набрать 90 баллов и больше из 100.' },
  { id: 'live-voice', title: 'Живое слово', description: 'Пройти минимум 3 этапа голосовым вводом.' },
  { id: 'de-escalation', title: 'Мастер деэскалации', description: 'Восстановить контакт после всплеска напряжённости выше 75%.' },
];

type SessionLike = { config: Config; turns: Turn[]; ended?: number; stageCount?: number };

/** Achievements earned by one finished session. */
export function earnedAchievements(session: SessionLike): AchievementId[] {
  const { config, turns } = session;
  const result = outcome(config, turns, sessionStageCount(session));
  const earned: AchievementId[] = [];
  if (turns.length && discoveredInterests(turns).size >= interestsFor(config).length) earned.push('harvard-diplomat');
  if (result.won && config.difficulty === 'Эксперт' && config.tone === 'Жёсткий') earned.push('steel-nerves');
  if (turns.some(turn => turn.timerLeft !== undefined && turn.timerLeft > 0 && turn.timerLeft < 5 && turn.points >= 15)) earned.push('pressure-decision');
  if (result.score >= 90) earned.push('win-win');
  if (turns.filter(turn => turn.voice).length >= 3) earned.push('live-voice');
  const deEscalated = turns.some((turn, index) => {
    const before = tension(config, turns.slice(0, index));
    const after = tension(config, turns.slice(0, index + 1));
    return before > 75 && after <= before - 10 && (turn.intent === 'repair' || turn.trust > 0);
  });
  if (deEscalated) earned.push('de-escalation');
  return earned;
}

/** Only the achievements that were not unlocked before. */
export function newAchievements(session: SessionLike, unlocked: Partial<Record<AchievementId, number>>) {
  return earnedAchievements(session).filter(id => !unlocked[id]);
}
