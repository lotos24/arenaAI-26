import { test } from 'node:test';
import assert from 'node:assert/strict';
import { arrangeChoices, choices, defaults, discoveredInterests, Domain, evaluateText, INTERESTS, outcome, pressureTimeLimit, respond, silenceChoice, stages, tension, Turn, withInterests } from '../lib/engine';

const domains: Domain[] = ['supplier', 'career', 'team'];

test('answer order is shuffled per session and stage, but stable for the same seed', () => {
  const options = choices('supplier', 0);
  assert.deepEqual(arrangeChoices(options, 'session-a:0'), arrangeChoices(options, 'session-a:0'));
  const firstPositions = new Set<number>();
  for (let i = 0; i < 40; i++) {
    const arranged = arrangeChoices(options, `session-${i}:0`);
    firstPositions.add(arranged.indexOf(options[0]));
    assert.equal(arranged.length, options.length);
  }
  assert.equal(firstPositions.size, 3, 'the best answer must appear in every position');
});

test('traps sound professional but score below the best move', () => {
  for (const domain of domains) {
    for (let stage = 0; stage < stages.length; stage++) {
      const [best, ...rest] = choices(domain, stage);
      for (const option of rest) assert.ok(option.points < best.points, `${domain} stage ${stage}`);
      assert.ok(!/согласен со всеми/.test(rest.map(option => option.text).join(' ')), 'no cartoonish total concession');
    }
  }
});

test('free text that touches a hidden interest reveals it and makes the opponent open up', () => {
  const config = defaults.supplier;
  const raw = evaluateText('Что для вас сейчас важнее: график оплаты или гарантированный объём?', 'supplier', 2);
  const move = withInterests('supplier', 2, raw, []);
  assert.deepEqual(move.interests?.sort(), ['payment', 'volume']);
  assert.ok(move.trust > raw.trust);
  assert.ok(move.points >= raw.points);
  assert.match(respond(config, 2, move, 60), /оплат|загрузка/);
  const turns: Turn[] = [{ ...move, reply: '' }];
  const again = withInterests('supplier', 3, evaluateText('Давайте закрепим объём и оплату в договоре.', 'supplier', 3), turns);
  assert.ok(!again.interests?.includes('volume'), 'an interest is revealed only once');
  assert.equal(discoveredInterests(turns).size, 2);
});

test('hostile moves never reveal interests', () => {
  const threat = evaluateText('Снижайте цену за объём, иначе мы уйдём.', 'supplier', 0);
  assert.equal(withInterests('supplier', 0, threat, []).interests, undefined);
});

test('every scenario has three hidden interests reachable by its best answers', () => {
  for (const domain of domains) {
    assert.equal(INTERESTS[domain].length, 3);
    let turns: Turn[] = [];
    for (let stage = 0; stage < stages.length; stage++) turns = [...turns, { ...withInterests(domain, stage, choices(domain, stage)[0], turns), reply: '' }];
    assert.ok(discoveredInterests(turns).size >= 2, `${domain}: best path reveals most interests`);
  }
});

test('silence under the pressure timer costs trust, raises tension and gets its own reply', () => {
  const config = { ...defaults.supplier, tone: 'Жёсткий' as const };
  const silence = silenceChoice();
  assert.ok(tension(config, [{ ...silence, reply: '' }]) > tension(config, []));
  assert.ok(outcome(config, [{ ...silence, reply: '' }]).trust < 50);
  assert.match(respond(config, 3, silence, 40), /молчание/);
  assert.ok(pressureTimeLimit({ ...config, difficulty: 'Эксперт' }) < pressureTimeLimit({ ...config, difficulty: 'Базовый' }));
});
