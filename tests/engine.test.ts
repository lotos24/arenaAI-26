import {test} from 'node:test';
import assert from 'node:assert/strict';
import {choices,defaults,evaluateText,outcome,respond,threshold,tension,tensionState,Domain,Config,Turn,stages} from '../lib/engine';
for(const domain of ['supplier','career','team'] as Domain[]) test(`${domain}: cooperative and hostile paths diverge`,()=>{const config=defaults[domain];const good=stages.map((_,i)=>({...choices(domain,i)[0],reply:''}));assert.equal(outcome(config,good).won,true);assert.equal(outcome(config,good).score,100);const bad=stages.map((_,i)=>({...choices(domain,i)[i===0?1:2],reply:''}));assert.equal(outcome(config,bad).won,false);assert.ok(outcome(config,good).trust>outcome(config,bad).trust);assert.equal(outcome(config,good.slice(0,-1)).won,false);});
test('configuration affects success threshold and replies',()=>{assert.ok(threshold({...defaults.supplier,difficulty:'Эксперт'})>threshold({...defaults.supplier,difficulty:'Базовый'}));const c=choices('supplier',2)[0];const config={...defaults.supplier,goal:'Снизить риски',tone:'Жёсткий' as const};assert.match(respond(config,2,c,70),/Перейдём к делу/);assert.match(respond(config,2,c,70),/снизить риски/);assert.match(respond(config,2,c,10),/остановим/)});
test('free text distinguishes proposals, threats, insults, and vague replies',()=>{
 const proposal=evaluateText('Предлагаю контракт на год и объём в обмен на рост цены 5%.','supplier',3);
 const threat=evaluateText('Вы обязаны принять наши условия, иначе мы уйдём.','supplier',0);
 const insult=evaluateText('Иди нахуй, хуесос.','career',2);
 const vague=evaluateText('Просто некоторый текст без конкретного приёма','career',4);
 assert.equal(proposal.skill,'Взаимный обмен');
 assert.equal(threat.intent,'threat');
 assert.equal(insult.intent,'insult');
 assert.ok((insult.tension??0)>(vague.tension??0));
 assert.equal(vague.intent,'vague');
});

test('one insult immediately heats the deal and a repeated insult breaks it',()=>{
 const config=defaults.career;
 const first={...evaluateText('Ты идиот, разговор окончен.','career',0),reply:''};
 const second={...evaluateText('Иди нахуй.','career',1),reply:''};
 assert.ok(tension(config,[first])>=70);
 assert.equal(tension(config,[first,second]),100);
 assert.equal(outcome(config,[first,second],2).collapsed,true);
});

test('contact needs empathy, acknowledgement, collaboration, and mutual value together',()=>{
 const keyword=evaluateText('Понимаю вашу позицию.','supplier',0);
 const complete=evaluateText('Понимаю, что рост издержек важен для вас. Давайте вместе найдём решение, чтобы сохранить сотрудничество и учесть интересы обеих сторон.','supplier',0);
 const negated=evaluateText('Я не понимаю вашу позицию, но давайте найдём решение.','supplier',0);
 assert.ok(keyword.points<=11);
 assert.ok(complete.points>=16);
 assert.ok(complete.trust>keyword.trust);
 assert.ok(negated.points<complete.points);
 assert.doesNotMatch(negated.feedback,/признание позиции/i);
 assert.match(keyword.feedback,/общую цель|ценность|вместе/i);
});

test('position framing rewards both sides, a boundary, and a check question',()=>{
 const oneSided=evaluateText('Наша позиция — цена должна быть ниже.','supplier',1);
 const aligned=evaluateText('Правильно ли я понимаю ваши условия: вам нужен рост на 15%, а наша позиция — не более 5%? Давайте сверим остальные ограничения.','supplier',1);
 assert.ok(oneSided.points<=11);
 assert.ok(aligned.points>=15);
 assert.equal(aligned.intent,'question');
 assert.match(oneSided.feedback,/обеих сторон|позици/i);
});

test('speech-like interest questions work without punctuation and ignore filler words',()=>{
 const closed=evaluateText('Вы согласны?','supplier',2);
 const spoken=evaluateText('ну эм хочу понять что для вас сейчас важнее цена объем или срок оплаты','supplier',2);
 assert.ok(closed.points<=7);
 assert.ok(spoken.points>=15);
 assert.equal(spoken.intent,'question');
 assert.match(spoken.feedback,/открытый вопрос/i);
});

test('a package scores above a lone number only when it contains reciprocal value',()=>{
 const lone=evaluateText('Предлагаю цену 5%.','supplier',3);
 const packageDeal=evaluateText('Предлагаю годовой контракт и гарантированный объём в обмен на рост цены не более 5%; для вас это сохранит загрузку.','supplier',3);
 assert.ok(lone.points<=11);
 assert.ok(packageDeal.points>=17);
 assert.ok((packageDeal.tension??0)<(lone.tension??0));
 assert.match(lone.feedback,/обмен|взамен/i);
});

test('objection handling separates acknowledgement from a concrete risk mechanism',()=>{
 const acknowledgement=evaluateText('Понимаю ваш риск.','supplier',4);
 const mitigation=evaluateText('Понимаю ваш риск по объёму. Давайте добавим квартальный коридор и пересмотр цены, если объём отклонится больше чем на 10%.','supplier',4);
 assert.ok(acknowledgement.points<=8);
 assert.ok(mitigation.points>=15);
 assert.equal(mitigation.intent,'proposal');
 assert.match(acknowledgement.feedback,/снизить риск|механизм|пилот|критерий|коридор/i);
});

test('closing needs terms, an owner, a deadline, and confirmation',()=>{
 const vague=evaluateText('Договорились.','career',5);
 const fixed=evaluateText('Зафиксируем роль и KPI письменно. Я отправлю итоги сегодня, а вы подтвердите, всё ли верно.','career',5);
 assert.ok(vague.points<=8);
 assert.ok(fixed.points>=17);
 assert.equal(fixed.intent,'commitment');
 assert.match(vague.feedback,/ответственного|срок|письмен/i);
});

const turn = (domain: Domain, stage: number, option: number): Turn => ({
 ...choices(domain, stage)[option], reply: ''
});

test('tone and difficulty both change the opening tension', () => {
 const tones: Config['tone'][] = ['Дружелюбный', 'Сдержанный', 'Жёсткий'];
 const difficulties: Config['difficulty'][] = ['Базовый', 'Продвинутый', 'Эксперт'];
 for (const difficulty of difficulties) {
  const values = tones.map(tone => tension({...defaults.supplier, tone, difficulty}, []));
  assert.ok(values[0] < values[1] && values[1] < values[2]);
 }
 for (const tone of tones) {
  const values = difficulties.map(difficulty => tension({...defaults.supplier, tone, difficulty}, []));
  assert.ok(values[0] < values[1] && values[1] < values[2]);
 }
});

for (const domain of ['supplier', 'career', 'team'] as Domain[]) {
 test(`${domain}: pressure raises tension and constructive replies lower it`, () => {
  const config = defaults[domain];
  for (let stage = 0; stage < stages.length; stage++) {
   const baseline = tension(config, []);
   const constructive = tension(config, [turn(domain, stage, 0)]);
   const pressure = tension(config, [turn(domain, stage, stage === 0 ? 1 : 2)]);
   assert.ok(constructive < baseline, `constructive stage ${stage}`);
   assert.ok(pressure > baseline, `pressure stage ${stage}`);
  }
 });
}

test('tension remains within 5–100 across every six-stage path', () => {
 for (const domain of ['supplier', 'career', 'team'] as Domain[]) {
  for (const tone of ['Дружелюбный', 'Сдержанный', 'Жёсткий'] as const) {
   for (const difficulty of ['Базовый', 'Продвинутый', 'Эксперт'] as const) {
    const config = {...defaults[domain], tone, difficulty};
    const visit = (turns: Turn[]) => {
     const value = tension(config, turns);
     assert.ok(value >= 5 && value <= 100, `${domain}, ${tone}, ${difficulty}: ${value}`);
     if (turns.length === stages.length) return;
     for (let option = 0; option < 3; option++) {
      visit([...turns, turn(domain, turns.length, option)]);
     }
    };
    visit([]);
   }
  }
 }
});

test('the tension limits allow an immediate response to the next choice', () => {
 const calm: Config = {...defaults.supplier, tone: 'Дружелюбный', difficulty: 'Базовый'};
 const contact = [0,1,2,3].map(stage => turn('supplier', stage, 0));
 assert.equal(tension(calm, contact), 5);
 assert.ok(tension(calm, [...contact, turn('supplier', 4, 2)]) > 5);
 assert.equal(tension(calm, [...contact, turn('supplier', 4, 0)]), 5);

 const difficult: Config = {...defaults.supplier, tone: 'Жёсткий', difficulty: 'Эксперт'};
 const confrontation = [turn('supplier', 0, 1), turn('supplier', 1, 2)];
 assert.equal(tension(difficult, confrontation), 100);
 assert.ok(tension(difficult, [...confrontation, turn('supplier', 2, 0)]) < 100);
 assert.equal(tension(difficult, [...confrontation, turn('supplier', 2, 2)]), 100);
});

test('tension measures unresolved pressure separately from trust', () => {
 const config = defaults.supplier;
 const concession = [turn('supplier', 0, 2)];
 assert.ok(outcome(config, concession).trust > outcome(config, []).trust);
 assert.ok(tension(config, concession) > tension(config, []));

 const friendly: Config = {...config, tone: 'Дружелюбный'};
 const harsh: Config = {...config, tone: 'Жёсткий'};
 assert.equal(outcome(friendly, []).trust, outcome(harsh, []).trust);
 assert.ok(tension(friendly, []) < tension(harsh, []));
});

test('saved session turns fully restore tension without extra persisted state', () => {
 const config: Config = {...defaults.career, tone: 'Жёсткий', difficulty: 'Эксперт'};
 const turns = [turn('career', 0, 1), turn('career', 1, 0), turn('career', 2, 0)];
 const saved = JSON.stringify({id: 'restored-session', config, turns, started: 1000});
 const restored = JSON.parse(saved) as {config: Config; turns: Turn[]};
 assert.equal(tension(restored.config, restored.turns), tension(config, turns));
 const finalTurn = turn('career', 3, 0);
 assert.equal(
  tension(restored.config, [...restored.turns, finalTurn]),
  tension(config, [...turns, finalTurn])
 );
 assert.equal(JSON.stringify({id: 'restored-session', config, turns, started: 1000}), saved);
});

test('tension labels switch at the visible warning thresholds', () => {
 assert.equal(tensionState(5).level, 'low');
 assert.equal(tensionState(44).level, 'low');
 assert.equal(tensionState(45).level, 'medium');
 assert.equal(tensionState(69).level, 'medium');
 assert.equal(tensionState(70).level, 'high');
 assert.equal(tensionState(100).level, 'high');
});

test('a negotiation collapses at 100 percent tension even with enough points', () => {
 const config:Config={...defaults.supplier,tone:'Жёсткий',difficulty:'Эксперт'};
 const turns=[turn('supplier',0,1),turn('supplier',1,2)];
 const result=outcome(config,turns,2);
 assert.equal(tension(config,turns),100);
 assert.equal(result.collapsed,true);
 assert.equal(result.won,false);
});
