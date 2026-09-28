import { test } from 'node:test';
import assert from 'node:assert/strict';
import { choices, defaults, Domain, evaluateText, finale, openingLine, outcome, RECOVERY_TENSION, respond, stages, tension, Turn } from '../lib/engine';
import { buildNegotiationPrompt } from '../lib/openai';

const domains: Domain[] = ['supplier', 'career', 'team'];
const turn = (domain: Domain, stage: number, option: number): Turn => ({ ...choices(domain, stage)[option], reply: '' });

test('ordinary words are not mistaken for insults', () => {
  for (const text of [
    'Понимаю, что сейчас плохо для обеих сторон. Давайте вместе найдём решение.',
    'Хлеба у нас хватает, давайте обсудим объём поставки и график оплаты.',
    'Для городского клиента важно качество, давайте сверим требования.',
  ]) assert.notEqual(evaluateText(text, 'supplier', 0).intent, 'insult', text);
  assert.equal(evaluateText('Вы идиот, снижайте цену', 'supplier', 0).intent, 'insult');
});

test('«иначе» alone is not an ultimatum, but a threat still is', () => {
  assert.notEqual(evaluateText('Может, посмотрим на вопрос иначе: что для вас важнее — срок или объём?', 'supplier', 2).intent, 'threat');
  assert.equal(evaluateText('Снижайте цену, иначе мы уйдём к конкуренту.', 'supplier', 0).intent, 'threat');
});

test('an apology earns repair credit only after a conflict', () => {
  const spam: Turn[] = stages.map((_, i) => ({ ...evaluateText('Извините, давайте начнем заново', 'supplier', i), reply: '' }));
  assert.equal(outcome(defaults.supplier, spam).won, false, 'repeating an apology must not win');
  assert.notEqual(spam[0].intent, 'repair');
  const threat = evaluateText('Снижайте цену, иначе мы уйдём.', 'supplier', 0);
  assert.equal(evaluateText('Извините, я перегнул. Давайте начнем заново.', 'supplier', 1, threat).intent, 'repair');
});

for (const domain of domains) {
  test(`${domain}: the opponent reply branches on strong, weak and hostile moves`, () => {
    const config = defaults[domain];
    for (let stage = 0; stage < stages.length; stage++) {
      const [strong, weak, hostile] = [0, 1, 2].map(option => respond(config, stage, choices(domain, stage)[option], 60));
      const hostileIndex = stage === 0 ? 1 : 2;
      const hostileReply = respond(config, stage, choices(domain, stage)[hostileIndex], 60);
      assert.notEqual(strong, hostileReply, `stage ${stage}: pressure must change the reply`);
      assert.ok(new Set([strong, weak, hostile]).size >= 2, `stage ${stage}`);
    }
  });

  test(`${domain}: every scenario has a winnable and a losable path with distinct endings`, () => {
    const config = defaults[domain];
    const good = stages.map((_, i) => turn(domain, i, 0));
    const bad = stages.map((_, i) => turn(domain, i, i === 0 ? 1 : 2));
    const won = outcome(config, good);
    const lost = outcome(config, bad);
    assert.equal(won.won, true);
    assert.equal(lost.won, false);
    const endings = new Set([finale(config, won, true), finale(config, lost, true), finale(config, { won: false, collapsed: false }, false)]);
    assert.equal(endings.size, 3);
  });
}

test('a recovery branch appears only near collapse and lowers tension', () => {
  assert.ok(choices('team', 2, 40).every(option => option.intent !== 'repair'));
  const offered = choices('team', 2, RECOVERY_TENSION);
  const recovery = offered.find(option => option.intent === 'repair');
  assert.ok(recovery);
  const config = { ...defaults.team, tone: 'Жёсткий' as const };
  const before = [turn('team', 0, 1)];
  assert.ok(tension(config, [...before, { ...recovery, reply: '' }]) < tension(config, before));
});

test('difficulty raises the cost of hostile moves, and tone changes the opening line', () => {
  const hostile = [turn('supplier', 0, 1)];
  const basic = { ...defaults.supplier, difficulty: 'Базовый' as const };
  const expert = { ...defaults.supplier, difficulty: 'Эксперт' as const };
  assert.ok(outcome(expert, hostile).trust < outcome(basic, hostile).trust);
  assert.ok(tension(expert, hostile) - tension(expert, []) > tension(basic, hostile) - tension(basic, []));
  assert.notEqual(openingLine({ ...defaults.team, tone: 'Жёсткий' }), openingLine({ ...defaults.team, tone: 'Дружелюбный' }));
});

test('the AI prompt carries the configured topic and opening line', () => {
  const config = { ...defaults.team, topic: 'Релиз мобильного банка' };
  const prompt = buildNegotiationPrompt(config, [], choices('team', 0)[0], 0);
  assert.match(prompt.input, /Релиз мобильного банка/);
  assert.match(prompt.input, /ночными сменами/);
});
