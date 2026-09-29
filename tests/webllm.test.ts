import { test } from 'node:test';
import assert from 'node:assert/strict';
import { choices, defaults, evaluateText, respond, Turn, withInterests } from '../lib/engine';
import { SCENARIO_PRESETS } from '../lib/scenario-library';
import { buildLocalPrompt, generateOpponentReplyWebLLM, initLocalAi, LOCAL_MODEL_OPTIONS, localAiReady, needsScriptedReply, personaGender, sanitizeLocalReply, sharesMeaning, useLocalAi, validateLocalContext } from '../lib/web-llm';

const turn = (stage: number): Turn => ({ ...choices('supplier', stage)[0], reply: 'Ответ собеседника.' });

test('the local prompt carries persona, goal, tone, stage, history and the scripted anchor', () => {
  const config = { ...defaults.team, topic: 'Релиз мобильного банка', tone: 'Жёсткий' as const };
  const [system, user] = buildLocalPrompt(config, [], choices(config, 0)[0], 0);
  assert.equal(system.role, 'system');
  assert.match(system.content, /Игорь Лебедев/);
  assert.match(system.content, /Релиз мобильного банка/);
  assert.match(system.content, /Защитить команду от переработок/);
  assert.match(system.content, /жёсткий/);
  assert.match(system.content, /только по-русски/);
  assert.match(user.content, /Установить контакт/);
  assert.match(user.content, /Суть твоего ответа/);
  assert.match(user.content, /Собеседник только что сказал тебе/);
  assert.match(user.content, /Давайте обсудим тему «Релиз мобильного банка»/, 'the opening line of a custom topic is part of the context');
});

test('history is trimmed to the last turns and touched interests are named', () => {
  const config = defaults.supplier;
  const history = [0, 1, 2, 3, 4].map(turn);
  const move = withInterests(config, 5, evaluateText('Зафиксируем объём и график оплаты письменно до пятницы.', 'supplier', 5), []);
  const [, user] = buildLocalPrompt(config, history, move, 5);
  assert.equal((user.content.match(/Игрок:/g) ?? []).length, 4);
  assert.match(user.content, /скрытый интерес/);
});

test('the customer case prompt uses its own persona and opening line', () => {
  const alabuga = SCENARIO_PRESETS.find(preset => preset.id === 'alabuga-investment')!.config;
  const [system, user] = buildLocalPrompt(alabuga, [], choices(alabuga, 0)[0], 0);
  assert.match(system.content, /Ильдар Сафин/);
  assert.match(system.content, /Синергия/);
  assert.match(user.content, /гарантии ввода мощностей/);
});

test('context validation rejects broken input before it reaches the model', () => {
  const config = defaults.career;
  assert.equal(validateLocalContext(config, [], choices(config, 0)[0], 0), null);
  assert.match(validateLocalContext(config, [], choices(config, 0)[0], 6) ?? '', /Этап/);
  assert.match(validateLocalContext(config, [turn(0)], choices(config, 0)[0], 0) ?? '', /История/);
  assert.match(validateLocalContext({ ...config, goal: ' ' }, [], choices(config, 0)[0], 0) ?? '', /цель/);
});

test('model output is cleaned, trimmed and rejected when it is not Russian', () => {
  assert.equal(sanitizeLocalReply('Собеседник: «Хорошо, давайте обсудим объём поставок.»'), 'Хорошо, давайте обсудим объём поставок.');
  assert.equal(sanitizeLocalReply('好的，我们讨论一下价格。'), null);
  assert.equal(sanitizeLocalReply('Sure, let us discuss the price and the volume.'), null);
  assert.equal(sanitizeLocalReply('Да.'), null);
  const long = sanitizeLocalReply('Первое предложение ответа. Второе предложение ответа. Третье предложение ответа. Четвёртое предложение ответа. Пятое лишнее.');
  assert.ok(long && !long.includes('Пятое'));
});

test('without WebGPU the reply falls back to the scenario engine instantly', async () => {
  await initLocalAi();
  assert.equal(useLocalAi.getState().status, 'unsupported');
  assert.equal(localAiReady(), false);
  const config = defaults.supplier;
  const move = choices(config, 0)[0];
  const result = await generateOpponentReplyWebLLM(config, [], move, 0);
  assert.equal(result.source, 'script');
  assert.equal(result.text, respond(config, 0, move, 61));
});

test('replies that drift from the scripted meaning or swap roles are rejected', () => {
  const anchor = 'Уйти — ваше право, но это не ускорит решение. Если хотите договориться, давайте без ультиматумов.';
  assert.equal(sanitizeLocalReply('Мы не будем уходить из ОЭЗ «Алабуга» без согласия. Попробуем ещё раз обсудить условия наладки бизнес-процессов.', anchor), null);
  const offer = 'Такой пакет уже выглядит сбалансированнее. Мне нужно понять, как вы гарантируете объём и что произойдёт при отклонении от прогноза.';
  assert.ok(sharesMeaning('Мне важно понять, как вы гарантируете рост объёма и что будет при отклонении от прогноза.', offer));
});

test('both model builds exist in two precisions and the quality build is the default', () => {
  for (const option of Object.values(LOCAL_MODEL_OPTIONS)) { assert.match(option.f16, /q4f16_1-MLC$/); assert.match(option.f32, /q4f32_1-MLC$/); }
  assert.equal(useLocalAi.getState().tier, 'quality');
  assert.match(LOCAL_MODEL_OPTIONS.light.f16, /^Qwen2\.5-0\.5B/);
});

test('a copied player line is rejected, a shared greeting is not', () => {
  const player = 'Спасибо, что нашли время. Понимаю, что для вас важно привлечь эксперта с реального производства. Давайте найдём решение, которое сработает для обеих сторон.';
  const anchor = 'Спасибо, что начали с этого. Для меня важно привлечь эксперта с реального производства, и мне интересно найти вариант, который устроит обе стороны.';
  assert.equal(sanitizeLocalReply('Спасибо, что нашли время. Понимаю, что для вас важно привлечь эксперта с реального производства. Давайте найдём решение для обеих сторон.', anchor, player), null);
  assert.ok(sanitizeLocalReply('Спасибо, что нашли время. Мне важно привлечь эксперта с реального производства и найти вариант, который устроит обе стороны.', anchor, player));
});

test('conflict moves always get the deterministic reply', () => {
  assert.ok(needsScriptedReply(choices('supplier', 1)[2]), 'ultimatum');
  assert.ok(needsScriptedReply(evaluateText('Вы идиот', 'supplier', 0)), 'insult');
  assert.ok(!needsScriptedReply(choices('supplier', 1)[0]), 'constructive move may use the model');
});

test('persona gender is taken from the first name', () => {
  assert.equal(personaGender('Ильдар Сафин'), 'male');
  assert.equal(personaGender('Алина Хасанова'), 'female');
  assert.equal(personaGender('Никита Орлов'), 'male');
  const [system] = buildLocalPrompt(SCENARIO_PRESETS[0].config, [], choices(SCENARIO_PRESETS[0].config, 0)[0], 0);
  assert.match(system.content, /мужском роде/);
});
