import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Config, defaults, evaluateText, outcome, respond, tension, Turn, withInterests } from '../lib/engine';
import { SCENARIO_PRESETS } from '../lib/scenario-library';
import { buildLocalPrompt, needsScriptedReply, reversesStance, sanitizeLocalReply, sharesMeaning, swapsRoles } from '../lib/web-llm';

const preset = (id: string) => SCENARIO_PRESETS.find(item => item.id === id)!.config;
/** Plays free-text lines the way the arena does: evaluate, touch interests, reply with the current trust. */
function play(config: Config, lines: string[]) {
  let turns: Turn[] = [];
  for (const [stage, text] of lines.entries()) {
    const move = withInterests(config, stage, evaluateText(text, config.domain, stage, turns[stage - 1]), turns);
    const reply = respond(config, stage, move, outcome(config, [...turns, { ...move, reply: '' }]).trust);
    turns = [...turns, { ...move, reply }];
  }
  return turns;
}

test('a polite opening with a question about interests is a strong move and gets an answer', () => {
  const config = preset('alabuga-polytech');
  const [first] = play(config, ['Добрый день, Алина. Спасибо, что нашли время. Скажите, что для вас важнее всего в работе со студентами?']);
  assert.ok(first.points >= 12, `points ${first.points}`);
  assert.ok(first.trust > 0 && (first.tension ?? 0) < 0, 'trust grows and tension falls');
  assert.equal(first.hinted, 'housing');
  assert.match(first.reply, /^Здравствуйте\./);
  assert.match(first.reply, /служебное жильё/, 'the opponent names a topic to take up');
  assert.doesNotMatch(first.reply, /цифр/, 'no reply about figures the player never named');
});

test('a clue is not repeated and taking it up reveals the interest', () => {
  const config = preset('alabuga-polytech');
  const turns = play(config, [
    'Добрый день! Что для вас важнее всего в этом проекте?',
    'А что для вас ещё важно, кроме этого?',
    'Давайте обсудим служебное жильё: что вы можете предложить наставнику?',
  ]);
  assert.equal(turns[0].hinted, 'housing');
  assert.notEqual(turns[1].hinted, 'housing', 'the next question gets another clue');
  assert.deepEqual(turns[2].interests, ['housing']);
  assert.match(turns[2].reply, /Служебное жильё в Елабуге мы можем предоставить/);
});

test('a figure the player names is answered, the opponent’s own figure is not', () => {
  const config = preset('raw-materials');
  const own = respond(config, 3, evaluateText('Мы готовы принять максимум 5 процентов', 'supplier', 3), 60);
  assert.match(own, /^5 процентов — это ваша цифра/);
  const quoted = respond(config, 0, evaluateText('Добрый день. Расскажите, что стоит за ростом на 15%?', 'supplier', 0), 60);
  assert.doesNotMatch(quoted, /15%/);
  const bare = respond(config, 3, evaluateText('Давайте 10 процентов и всё', 'supplier', 3), 60);
  assert.match(bare, /10 процентов/);
  assert.doesNotMatch(bare, /не услышал/, 'a named figure is not answered with «no offer heard»');
});

test('a weak free-text move gets the missing piece in the opponent’s voice', () => {
  const lone = evaluateText('Предлагаю цену 5%.', 'supplier', 3);
  assert.ok(lone.gaps?.includes('exchange'));
  assert.match(respond(defaults.supplier, 3, lone, 60), /взамен/);
  const closing = evaluateText('Спасибо!', 'career', 5);
  assert.match(respond(defaults.career, 5, closing, 60), /И вам спасибо\. .*договорились/);
});

test('check questions and blanket agreement get their own answers', () => {
  const config = preset('alabuga-polytech');
  const check = evaluateText('Правильно ли я понимаю, что вам нужен наставник на полставки, а мне важно сохранить работу на заводе?', 'career', 1);
  assert.match(respond(config, 1, check, 60), /^(?:Да, в целом вы поняли верно|Отчасти верно)\./);
  const agree = evaluateText('Хорошо, мы согласны на ваши условия', 'career', 4);
  assert.ok(agree.cues?.includes('concession'));
  assert.match(respond(config, 4, agree, 60), /^Рада, что мы сходимся/);
});

test('«мне нужно» inside a check question is framing, not a demand', () => {
  const check = evaluateText('Правильно ли я понимаю, что служебное жильё в Елабуге для вас важно, а мне нужно сохранить работу на заводе не меньше трёх дней в неделю?', 'career', 1);
  assert.notEqual(check.intent, 'demand');
  assert.ok(check.trust > 0);
  const move = withInterests(preset('alabuga-polytech'), 1, check, []);
  assert.deepEqual(move.interests, ['housing']);
  assert.equal(evaluateText('Мне нужно повышение зарплаты уже в этом месяце', 'career', 1).intent, 'demand');
});

test('the opponent speaks in the persona’s gender', () => {
  const alina = preset('alabuga-polytech');
  assert.match(respond(alina, 2, evaluateText('Ты идиот', 'career', 2), 60), /не готова/);
  assert.match(respond(alina, 2, evaluateText('Я требую повышения зарплаты прямо сейчас', 'career', 2), 60), /услышала/);
  assert.match(respond(defaults.supplier, 2, evaluateText('Я требую скидку на все поставки сейчас', 'supplier', 2), 60), /услышал /);
});

test('a strong final move closes with the agreement', () => {
  const reply = respond(defaults.supplier, 5, evaluateText('Итак, 8%, объём на год, ответственный с нашей стороны — Иванов, протокол до пятницы', 'supplier', 5), 60);
  assert.match(reply, /(?:Да, так и зафиксируем|Договорились, картина общая)\. [^.]+\.$/);
  assert.ok(reply.indexOf('8%') < reply.search(/Да, так и зафиксируем|Договорились/), 'the agreement closes the reply');
});

test('a greeting alone is weak but not hostile', () => {
  const config = defaults.career;
  const hello = evaluateText('Добрый день!', 'career', 0);
  assert.equal(hello.trust, 0);
  assert.ok(tension(config, [{ ...hello, reply: '' }]) - tension(config, []) < 10);
  assert.match(respond(config, 0, hello, 60), /^Взаимно, рада встрече\./);
});

test('free text reaches the local model unless it is a real conflict', () => {
  assert.ok(!needsScriptedReply(evaluateText('Нам нужна скидка', 'supplier', 2)), 'weak move');
  assert.ok(!needsScriptedReply(evaluateText('Добрый день!', 'supplier', 0)), 'greeting');
  assert.ok(needsScriptedReply(evaluateText('Снижайте цену, иначе мы уйдём.', 'supplier', 0)), 'threat');
  assert.ok(needsScriptedReply(evaluateText('Я требую скидку на все поставки сейчас', 'supplier', 2)), 'demand');
});

test('the model is asked to answer the player’s question and keep the gist', () => {
  const config = preset('alabuga-polytech');
  const move = withInterests(config, 0, evaluateText('Добрый день! Что для вас важнее всего в этом проекте?', 'career', 0), []);
  const [, user] = buildLocalPrompt(config, [], move, 0);
  assert.match(user.content, /ответ на него уже есть в сути/);
  assert.match(user.content, /Суть твоего ответа: «Здравствуйте\./);
  const offer = buildLocalPrompt(defaults.supplier, [], evaluateText('Мы готовы принять максимум 5 процентов', 'supplier', 0), 0)[1];
  assert.match(offer.content, /назвал цифру «5 процентов»/);
});

test('model replies that speak for the player are rejected', () => {
  const anchor = 'Отвечу прямо. Мой главный KPI — трудоустройство выпускников на заводы зоны. Если вы поможете его поднять, мы договоримся.';
  const player = 'Что для вас будет показателем успеха через год?';
  assert.ok(swapsRoles('Хорошо, Алина. Могу я спросить, почему именно трудоустройство выпускников для вас такой важный показатель успеха?', anchor, 'Алина Хасанова'));
  assert.ok(swapsRoles('Здравствуйте, Алина. Хороший вопрос.', anchor, 'Алина Хасанова'), 'the persona’s own name');
  assert.equal(sanitizeLocalReply('Почему трудоустройство выпускников так важно для вашего кластера?', anchor, player, 'Алина Хасанова'), null);
  assert.ok(!swapsRoles('Мой главный KPI — трудоустройство выпускников. Готовы ли вы помочь его поднять?', anchor, 'Алина Хасанова'));
  assert.ok(!swapsRoles('Что вы готовы дать взамен за ваши условия?', 'И что вы готовы дать взамен?', 'Ильдар Сафин'), 'the gist itself asks');
  assert.ok(sanitizeLocalReply('Для меня главный показатель — трудоустройство выпускников на заводы зоны. Поможете его поднять — договоримся.', anchor, player, 'Алина Хасанова'));
  const greeting = 'Здравствуйте. Хороший вопрос. Многое для меня зависит от темы, которую мы ещё не обсуждали: служебное жильё в Елабуге.';
  assert.equal(sanitizeLocalReply('Здравствуйте, Алина. Хороший вопрос. Многое для меня зависит от темы, которую мы ещё не обсуждали: служебное жильё в Елабуге.', greeting, 'Добрый день, Алина! Что для вас важнее всего?', 'Алина Хасанова'), greeting, 'an echoed vocative is cut, the rest is kept');
});

test('meta prefixes are cut and a reversed agreement is rejected', () => {
  const anchor = '5 процентов — это ваша цифра. Мне пока неясно, почему она должна меня устроить.';
  assert.equal(sanitizeLocalReply('Вот пример ответа: Ты: 5 процентов — это ваша цифра, и мне неясно, почему она должна меня устроить.', anchor), '5 процентов — это ваша цифра, и мне неясно, почему она должна меня устроить.');
  const gist = 'Скажу прямо: мне сложно раскрыться, пока разговор идёт вокруг требований. Спросите, что стоит за моей позицией, — я отвечу.';
  assert.equal(sanitizeLocalReply(`Нам нужна скидка. Ты: ${gist}`, gist, 'Нам нужна скидка'), gist, 'a replayed dialogue keeps only the reply');
  assert.equal(sanitizeLocalReply('10% — это мой рабочий ориентир. Это понятно и предсказуемо, что риск выглядит управляемым. Мы можем договориться на таком уровне, если я понимаю, как вам важно регулярное обсуждение цен. Понимаю, что вы хотите контролировать риски, но не вижу необходимости, чтобы они были огромными.', '10% — принимаю как рабочий ориентир. С таким механизмом риск выглядит управляемым.'), null, 'a rambling retelling');
  const closing = '8% — принимаю как рабочий ориентир. Да, так и зафиксируем. Жду протокол — сверю пункты со своей стороны.';
  assert.ok(reversesStance('8% — мой ориентир, но давайте пересмотрим этот пункт в свете всего нашего диалога.', closing));
  assert.ok(!reversesStance('Принимаю 8% как ориентир, фиксируем. Протокол сверю, как получу.', closing));
  assert.ok(!reversesStance('Коридор и пересмотр цены раз в квартал снимают мои опасения.', 'С таким механизмом риск выглядит управляемым. Это снимает большую часть моих опасений.'));
});

test('a model reply that answers the player’s words may keep less of the gist', () => {
  const anchor = 'Хороший вопрос. Многое для меня зависит от темы, которую мы ещё не обсуждали: служебное жильё в Елабуге.';
  const player = 'Что для вас важнее всего в работе со студентами?';
  assert.ok(sharesMeaning('Для работы со студентами мне важно одно: служебное жильё для наставника.', anchor, player));
  assert.ok(!sharesMeaning('Давайте обсудим цену поставки и график оплаты.', anchor, player));
});
