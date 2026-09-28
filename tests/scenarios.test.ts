import { test } from 'node:test';
import assert from 'node:assert/strict';
import { choices, defaults, discoveredInterests, evaluateText, interestsFor, openingLine, respond, scenarioFor, stages, STORY_TOPICS, Turn, usesStory, withInterests } from '../lib/engine';
import { mapLevels } from '../lib/progression';
import { parseScenario, SCENARIO_PRESETS, serializeScenario } from '../lib/scenario-library';

const preset = (id: string) => SCENARIO_PRESETS.find(item => item.id === id)!.config;

test('map levels and story-fitting presets keep the hand-written stories', () => {
  for (const level of mapLevels.filter(level => !level.config.custom)) assert.ok(usesStory(level.config), level.id);
  for (const id of ['raw-materials', 'grade', 'hot-release', 'counteroffer']) assert.ok(usesStory(preset(id)), id);
  assert.ok(STORY_TOPICS.supplier.includes(defaults.supplier.topic));
});

test('a custom topic switches every scripted text to templates with topic, role and goal', () => {
  const config = { ...defaults.supplier, topic: 'Аренда склада в технопарке', role: 'Директор технопарка', goal: 'Заполнить склад арендаторами на три года' };
  assert.equal(usesStory(config), false);
  const texts = [scenarioFor(config).brief, openingLine(config), ...stages.flatMap((_, stage) => choices(config, stage).map(option => option.text)), ...stages.map((_, stage) => respond(config, stage, choices(config, stage)[0], 60))].join(' ');
  assert.doesNotMatch(texts, /15%|поставщик|ночны/, 'no leftovers of the supplier or team story');
  assert.match(texts, /Аренда склада в технопарке/);
  assert.match(texts, /заполнить склад арендаторами/);
  assert.match(scenarioFor(config).brief, /директор технопарка/);
});

test('B2B discount preset no longer talks about a 15% price rise', () => {
  const config = preset('b2b-discount');
  assert.equal(usesStory(config), false);
  assert.doesNotMatch(openingLine(config) + choices(config, 1)[0].text, /15%/);
});

test('Alabuga investment case has its own persona, frame and hidden interests', () => {
  const config = preset('alabuga-investment');
  assert.deepEqual([config.domain, config.difficulty, config.tone], ['supplier', 'Эксперт', 'Жёсткий']);
  const scenario = scenarioFor(config);
  assert.equal(scenario.person, 'Ильдар Сафин');
  assert.match(scenario.frame.batna, /соседнем регионе/);
  assert.deepEqual(interestsFor(config).map(item => item.id), ['first-stage', 'power', 'localization']);
  const move = withInterests(config, 2, evaluateText('Какой объём инвестиций первой очереди и техприсоединение на 15 МВт для вас критичны?', 'supplier', 2), []);
  assert.deepEqual(move.interests, ['first-stage', 'power']);
  assert.match(respond(config, 2, move, 60), /первой очереди/);
});

test('Alabuga Polytech case reveals housing, freedom and employment KPI interests', () => {
  const config = preset('alabuga-polytech');
  assert.deepEqual([config.domain, config.difficulty, config.tone], ['career', 'Продвинутый', 'Сдержанный']);
  let turns: Turn[] = [];
  for (const [stage, text] of [[1, 'Мне важен переезд: есть ли служебное жильё в Елабуге?'], [2, 'Смогу ли я строить свою авторскую программу практики?'], [3, 'Предлагаю связать бонус с трудоустройством выпускников.']] as const) {
    turns = [...turns, { ...withInterests(config, stage, evaluateText(text, 'career', stage), turns), reply: '' }];
  }
  assert.equal(discoveredInterests(turns).size, 3);
  assert.ok(mapLevels.some(level => level.id === 'alabuga-polytech' && level.requiredRank === 0), 'customer cases are open on the map from the start');
});

test('extended JSON keeps the custom opening line and hidden interests', () => {
  const config = { ...defaults.team, topic: 'Своя тема', custom: { opening: 'Своя первая реплика.', interests: [{ id: 'budget', label: 'Бюджет', hint: 'Спросите о бюджете.', keywords: ['бюджет'], reveal: 'Бюджет у нас ограничен.' }] } };
  const restored = parseScenario(serializeScenario(config));
  assert.deepEqual(restored, config);
  assert.match(openingLine(restored), /Своя первая реплика/);
  assert.throws(() => parseScenario(JSON.stringify({ ...config, custom: { interests: [{ label: 'Без ключей', reveal: 'x' }] } })), /ключевое слово/);
  assert.throws(() => parseScenario(JSON.stringify({ ...config, custom: { frame: { goal: 'только цель' } } })), /goal, batna и zopa/);
});
