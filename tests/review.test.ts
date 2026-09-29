import { test } from 'node:test';
import assert from 'node:assert/strict';
import { choices, Config, defaults, evaluateText, outcome, respond, stages, Turn, withInterests } from '../lib/engine';
import { dealSummary } from '../lib/deal';
import { judgeSession } from '../lib/judges';
import { DEMO_CONFIG, DEMO_ROUTE } from '../lib/demo';
import { sessionMemo } from '../lib/methods';

/** Plays moves the way the arena does; each move is made a minute after the previous one. */
function play(config: Config, moves: ((stage: number, turns: Turn[]) => ReturnType<typeof evaluateText>)[]) {
  let turns: Turn[] = [];
  moves.forEach((move, stage) => {
    const c = withInterests(config, stage, { ...move(stage, turns), at: (stage + 1) * 60_000 + 17_000 }, turns);
    turns = [...turns, { ...c, reply: respond(config, stage, c, outcome(config, [...turns, { ...c, reply: '' }]).trust) }];
  });
  return turns;
}
const best = (config: Config) => stages.map(() => (stage: number) => choices(config, stage)[0]);
const demo = () => play(DEMO_CONFIG, DEMO_ROUTE.map(step => (stage: number, turns: Turn[]) => step.kind === 'say'
  ? evaluateText(step.text, DEMO_CONFIG.domain, stage, turns[stage - 1])
  : choices(DEMO_CONFIG, stage).find(option => option.text.includes(step.phrase))!));

test('all three judges choose a player who took the constructive path', () => {
  const turns = play(defaults.supplier, best(defaults.supplier));
  const verdicts = judgeSession(defaults.supplier, turns, 6);
  assert.deepEqual(verdicts.map(item => item.chosen), [true, true, true]);
  for (const verdict of verdicts) {
    assert.ok(verdict.strong, `${verdict.id} has a strong episode`);
    assert.match(verdict.strong!.effect, /напряжённость|доверие|интерес|Собеседник/);
  }
});

test('pressure and a concession for nothing turn the judges against the player, with the episode that did it', () => {
  const config = defaults.supplier;
  const turns = play(config, [
    stage => choices(config, stage)[1],
    stage => choices(config, stage)[2],
    stage => choices(config, stage)[1],
    stage => choices(config, stage)[1],
    stage => choices(config, stage)[1],
    stage => choices(config, stage)[1],
  ]);
  const [employee, delegate, owner] = judgeSession(config, turns, 6);
  assert.equal(employee.chosen, false);
  assert.equal(employee.weak?.stage, 0, 'the ultimatum is the weak episode');
  assert.match(employee.weak!.effect, /напряжённость \d+% → \d+%/i);
  assert.equal(delegate.chosen, false);
  assert.equal(owner.chosen, false);
  assert.match(owner.comment, /уступку без встречного условия/);
});

test('the demo route is a win the judges can explain', () => {
  const turns = demo();
  const verdicts = judgeSession(DEMO_CONFIG, turns, 6);
  const employee = verdicts[0];
  assert.equal(employee.weak?.stage, 2, 'the pressure move is the weak episode for relations');
  assert.ok(verdicts[1].chosen, 'the demo finds interests and reaches the deal');
  assert.equal(verdicts[1].strong?.at, 60_000 * 2 + 17_000, 'episodes carry the time of the move');
});

test('the deal summary lists the fixed terms and the price of the result', () => {
  const deal = dealSummary(DEMO_CONFIG, demo(), 6);
  assert.equal(deal.status, 'agreement');
  assert.ok(deal.terms.some(term => term.kind === 'owner' && /протокол до пятницы/.test(term.text)), 'owner and date');
  assert.ok(deal.terms.some(term => term.kind === 'condition' && /если трудоустройство/.test(term.text)), 'the review condition');
  assert.ok(deal.interests.length >= 2);
  assert.ok(deal.costs.some(cost => /Давление стоило доверия/.test(cost.text)), 'the pressure move has a price');
  const config = defaults.supplier;
  const cheap = play(config, stages.map((_, stage) => (s: number) => choices(config, s)[stage === 3 ? 1 : 0]));
  assert.ok(dealSummary(config, cheap, 6).costs.some(cost => /Уступка без встречного условия/.test(cost.text)), 'a concession for nothing');
});

test('a collapsed negotiation has no terms, and an early stop is a postponed decision', () => {
  const config: Config = { ...defaults.supplier, tone: 'Жёсткий', difficulty: 'Эксперт' };
  const collapsed = play(config, [stage => choices(config, stage)[1], stage => choices(config, stage)[2]]);
  assert.equal(dealSummary(config, collapsed, 2).status, 'collapsed');
  assert.deepEqual(dealSummary(config, collapsed, 2).terms, []);
  const early = play(defaults.career, [stage => choices(defaults.career, stage)[0]]);
  assert.equal(dealSummary(defaults.career, early, 6).status, 'early');
});

test('the memo quotes moves with their time and includes the judges', () => {
  const turns = play(defaults.supplier, best(defaults.supplier));
  const memo = sessionMemo({ config: defaults.supplier, turns, started: 0, ended: 400_000, stageCount: 6 });
  assert.match(memo, /01:17/);
  assert.match(memo, /Три судьи/);
  assert.match(memo, /Что договорились/);
});
