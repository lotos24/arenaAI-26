import { test } from 'node:test';
import assert from 'node:assert/strict';
import { choices, defaults, Domain, evaluateText, respond, scenarios, stages, Turn, withInterests } from '../lib/engine';
import { competencyProfile, harvardAssessment, sessionMemo, techniqueFor } from '../lib/methods';
import { parseScenario, SCENARIO_PRESETS, serializeScenario } from '../lib/scenario-library';
import { groupCsv, StudentReport } from '../lib/teacher';

const domains: Domain[] = ['supplier', 'career', 'team'];
const path = (domain: Domain, pick: (stage: number) => number) => {
  let turns: Turn[] = [];
  for (let stage = 0; stage < stages.length; stage++) turns = [...turns, { ...withInterests(domain, stage, choices(domain, stage)[pick(stage)], turns), reply: '' }];
  return turns;
};
const session = (domain: Domain, turns: Turn[]) => ({ config: defaults[domain], turns, started: 1_700_000_000_000, ended: 1_700_000_600_000, stageCount: 6 });

test('the case library has the five requested presets and each survives export → import', () => {
  const expected: Array<[string, Domain, string, string]> = [
    ['Закупки: рост цен сырья на 15%', 'supplier', 'Сдержанный', 'Продвинутый'],
    ['Карьера: защита грейда и зарплаты', 'career', 'Дружелюбный', 'Базовый'],
    ['IT-проект: горящий релиз клиента', 'team', 'Жёсткий', 'Эксперт'],
    ['B2B-продажи: требование скидки 25%', 'supplier', 'Жёсткий', 'Продвинутый'],
    ['HR: удержание тимлида при контроффере', 'career', 'Сдержанный', 'Продвинутый'],
  ];
  assert.deepEqual(SCENARIO_PRESETS.map(preset => [preset.title, preset.config.domain, preset.config.tone, preset.config.difficulty]), expected);
  for (const preset of SCENARIO_PRESETS) assert.deepEqual(parseScenario(serializeScenario(preset.config)), preset.config);
});

test('scenario import rejects broken JSON and unknown values with a readable message', () => {
  assert.throws(() => parseScenario('не json'), /не JSON/);
  assert.throws(() => parseScenario(JSON.stringify({ ...defaults.supplier, domain: 'poker' })), /сфера/);
  assert.throws(() => parseScenario(JSON.stringify({ ...defaults.supplier, tone: 'Злой' })), /тон/);
  assert.throws(() => parseScenario(JSON.stringify({ ...defaults.supplier, goal: '  ' })), /Цель/);
  assert.deepEqual(parseScenario(JSON.stringify(defaults.team)), defaults.team, 'a bare config is accepted too');
});

test('every scripted answer carries a negotiation technique; the stage-0 threat is BATNA misuse', () => {
  for (const domain of domains) for (let stage = 0; stage < stages.length; stage++) for (const option of choices(domain, stage)) assert.ok(techniqueFor(option), `${domain} ${stage}: ${option.skill}`);
  assert.equal(techniqueFor(choices('supplier', 0)[1])?.id, 'batnaThreat');
  assert.equal(techniqueFor(choices('supplier', 3)[0])?.label, 'Гарвард: Пакетный обмен');
  assert.equal(techniqueFor(choices('supplier', 2)[0])?.label, 'Гарвард: Интересы');
});

test('a calm reference to the alternative is recognised as BATNA, a threat is not', () => {
  const calm = evaluateText('У нас есть альтернативное предложение с ростом 8%, но мы хотели бы договориться с вами.', 'supplier', 1);
  assert.equal(techniqueFor(calm)?.id, 'batna');
  assert.ok(calm.trust > 0, 'a calm BATNA never costs trust');
  assert.doesNotMatch(respond(defaults.career, 1, evaluateText('Для прозрачности: у меня есть оффер от другой компании, но мне важно расти здесь. Какие ограничения по бюджету есть у вас?', 'career', 1), 50), /только мой ответ/);
  assert.notEqual(techniqueFor(evaluateText('Снижайте цену, иначе мы уйдём к другому поставщику.', 'supplier', 0))?.id, 'batna');
});

test('every scenario exposes a negotiation frame: goal, BATNA and ZOPA', () => {
  for (const domain of domains) for (const key of ['goal', 'batna', 'zopa'] as const) assert.ok(scenarios[domain].frame[key].length > 20, `${domain}.${key}`);
});

test('Harvard assessment separates a collaborative session from a hostile one', () => {
  const good = harvardAssessment(defaults.supplier, path('supplier', () => 0));
  assert.ok(good.every(item => item.status === 'yes'), JSON.stringify(good));
  const bad = harvardAssessment(defaults.supplier, path('supplier', stage => stage === 0 ? 1 : 2));
  assert.equal(bad.find(item => item.id === 'people')?.status, 'no');
  assert.equal(bad.find(item => item.id === 'interests')?.status, 'no');
});

test('competency profile is empty without history and high for a strong session', () => {
  const empty = competencyProfile([]);
  assert.equal(empty.sessions, 0);
  assert.ok(empty.items.every(item => item.value === null));
  const strong = competencyProfile([session('team', path('team', () => 0))]);
  assert.equal(strong.items.length, 5);
  assert.ok(strong.items.every(item => item.value !== null && item.value >= 80), JSON.stringify(strong.items));
  const weak = competencyProfile([session('team', path('team', stage => stage === 0 ? 1 : 2))]);
  assert.ok(weak.items.every(item => (item.value ?? 0) < 60), JSON.stringify(weak.items));
});

test('session memo lists result, interests, Harvard assessment, strengths and advice', () => {
  const memo = sessionMemo(session('career', path('career', stage => stage < 3 ? 0 : 1)));
  for (const part of ['Памятка по переговорам', 'Результат:', 'Скрытые интересы', 'Гарвардскому методу', 'Сильные стороны', 'Что улучшить', 'Попробуйте:']) assert.match(memo, new RegExp(part));
});

test('group CSV has a BOM, a header and escapes separators', () => {
  const report: StudentReport = { version: 1, id: 'r', learner: 'Иванов; Пётр', classCode: 'A-1', generatedAt: 0, sessions: [
    { id: 's1', topic: 't', difficulty: 'Базовый', score: 80, trust: 70, tension: 20, won: true, ended: 1_700_000_000_000 },
    { id: 's2', topic: 't', difficulty: 'Базовый', score: 40, trust: 30, tension: 90, won: false, ended: 1_700_000_100_000 },
  ] };
  const csv = groupCsv([report]);
  assert.ok(csv.startsWith('﻿Ученик;Класс;Сессий;Средний балл;XP;Звание;Договорённостей, %'));
  const row = csv.split('\r\n')[1];
  assert.ok(row.startsWith('"Иванов; Пётр";A-1;2;60;120;'));
  assert.match(row, /;50;/);
});
