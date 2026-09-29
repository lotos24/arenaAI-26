import { test } from 'node:test';
import assert from 'node:assert/strict';
import { choices, discoveredInterests, evaluateText, outcome, respond, stages, tension, Turn, withInterests } from '../lib/engine';
import { DEMO_CONFIG, DEMO_ROUTE } from '../lib/demo';

/** Plays the demo the way the arena does, without the local model. */
function playDemo() {
  let turns: Turn[] = [];
  const tensions = [tension(DEMO_CONFIG, [])];
  for (const [stage, step] of DEMO_ROUTE.entries()) {
    const raw = step.kind === 'say'
      ? evaluateText(step.text, DEMO_CONFIG.domain, stage, turns[stage - 1])
      : choices(DEMO_CONFIG, stage, tension(DEMO_CONFIG, turns)).find(option => option.text.includes(step.phrase));
    assert.ok(raw, `step ${stage + 1} has a move`);
    const move = withInterests(DEMO_CONFIG, stage, raw, turns);
    turns = [...turns, { ...move, reply: respond(DEMO_CONFIG, stage, move, outcome(DEMO_CONFIG, [...turns, { ...move, reply: '' }]).trust) }];
    tensions.push(tension(DEMO_CONFIG, turns));
  }
  return { turns, tensions };
}

test('the demo route covers every stage and ends in an agreement', () => {
  assert.equal(DEMO_ROUTE.length, stages.length);
  const { turns } = playDemo();
  const result = outcome(DEMO_CONFIG, turns);
  assert.ok(result.won, `score ${result.score}, trust ${result.trust}`);
  assert.ok(discoveredInterests(turns).size >= 2, 'interests are revealed on the way');
});

test('the demo shows a clue, pressure and a repair', () => {
  const { turns, tensions } = playDemo();
  assert.match(turns[0].reply, /ещё не обсуждали/, 'the interest question earns a clue');
  assert.ok(turns[1].interests?.length, 'the clue is taken up');
  assert.ok(tensions[3] > tensions[2] + 10, 'pressure raises tension');
  assert.equal(turns[3].intent, 'repair');
  assert.ok(tensions[4] < tensions[3], 'the repair lowers it');
});
