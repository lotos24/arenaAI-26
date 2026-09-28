export type Domain = 'supplier' | 'career';
export type Config = { domain: Domain; topic: string; difficulty: 'Базовый' | 'Продвинутый' | 'Эксперт'; tone: 'Сдержанный' | 'Дружелюбный' | 'Жёсткий'; role: string; goal: string };
export type NegotiationIntent = 'scripted' | 'insult' | 'threat' | 'vague' | 'demand' | 'question' | 'proposal' | 'repair' | 'commitment';
export type Choice = { text: string; skill: string; points: number; trust: number; feedback: string; tension?: number; intent?: NegotiationIntent };
export type Turn = Choice & { reply: string };
export const defaults: Record<Domain, Config> = {
 supplier: { domain: 'supplier', topic: 'Цена долгосрочного контракта', difficulty: 'Продвинутый', tone: 'Сдержанный', role: 'Директор по продажам', goal: 'Сохранить маржу и получить гарантированный объём' },
 career: { domain: 'career', topic: 'Повышение и новая зона ответственности', difficulty: 'Базовый', tone: 'Дружелюбный', role: 'Руководитель команды', goal: 'Удержать сотрудника в рамках бюджета отдела' }
};
export const scenarios = {
 supplier: { title: 'По обе стороны сделки', label: 'Закупки и продажи', person: 'Александр Морозов', initials: 'АМ', description: 'Поставщик повышает цены на 15%. Сохраните бюджет и отношения, найдя решение для обеих сторон.', brief: 'Вы руководите закупками. Поставщик уведомил о повышении цены на 15%. Ваша цель — ограничить рост до 5%. Вы можете предложить контракт на год и гарантированный объём. Альтернатива: другой поставщик с ростом цены 8%, но переход займёт месяц.', opening: 'Мы вынуждены поднять цены на 15%. Издержки выросли, и прежние условия больше не работают.' },
 career: { title: 'Следующая ступень', label: 'Карьера и развитие', person: 'Анна Соколова', initials: 'АС', description: 'Вы готовы к большей роли. Обсудите повышение, опираясь на результаты и интересы команды.', brief: 'За полгода вы сократили сроки проектов на 20% и обучили двух коллег. Вы хотите повышение зарплаты на 15% и ведущую роль. Бюджет ограничен. Альтернатива: согласовать повышение через три месяца по измеримым результатам.', opening: 'Я ценю вашу работу, но бюджет на повышения сейчас ограничен. Что вы хотели бы предложить?' }
};
const choice = (text: string, skill: string, points: number, trust: number, feedback: string): Choice => ({text,skill,points,trust,feedback});
export const stages = [
 'Установить контакт',
 'Сверить позиции',
 'Выяснить интересы',
 'Собрать пакет условий',
 'Снять возражение',
 'Закрепить договорённость',
];
export const SESSION_STAGE_COUNT = stages.length;
export function choices(domain: Domain, stage: number): Choice[] {
 const supplier = domain === 'supplier';
 return [
 [choice(supplier ? 'Понимаю, что издержки выросли. Давайте посмотрим, как сохранить сотрудничество и экономику обеих сторон.' : 'Спасибо за возможность обсудить мой рост. Хочу найти решение, которое усилит и мой вклад, и команду.', 'Контакт', 17, 11, 'Вы признали позицию собеседника и обозначили общую цель.'), choice(supplier ? 'У других поставщиков дешевле. Снижайте цену, иначе мы уйдём.' : 'Если повышения не будет, мне придётся уйти.', 'Давление', 3, -17, 'Ультиматум сужает пространство для обсуждения. Сначала выясните ограничения.'), choice('Хорошо, я согласен со всеми вашими условиями.', 'Уступка', 5, 3, 'Вы сохранили спокойствие, но отказались от своей цели без обсуждения.')],
 [choice(supplier ? 'Правильно понимаю: вам нужен рост на 15%, а для нас приемлемо не больше 5%? Давайте сверим, что ещё входит в условия.' : 'Я рассчитываю на ведущую роль и рост на 15%. Какие ограничения по бюджету и срокам есть у команды?', 'Рамка разговора', 17, 9, 'Вы спокойно обозначили обе позиции и открыли пространство для уточнений.'), choice(supplier ? 'Давайте сразу остановимся на 8% и не будем усложнять.' : 'Назовите максимальную прибавку, которую можете дать сейчас.', 'Торопливый торг', 11, 2, 'Вы перешли к цифрам до того, как узнали причины и возможные обмены.'), choice('Моя позиция окончательная. От вас требуется только согласие.', 'Давление', 3, -16, 'Жёсткая фиксация позиции заставляет собеседника защищаться.')],
 [choice(supplier ? 'Что сильнее влияет на цену? Поможет ли гарантированный объём, срок контракта или график оплаты?' : 'Какие результаты, ответственность и сроки позволят вам обосновать повышение?', 'Интересы', 19, 12, 'Открытый вопрос переводит разговор от заявленных позиций к интересам и ограничениям.'), choice('Расскажите подробнее, что для вас сейчас самое важное.', 'Уточнение', 13, 6, 'Полезный вопрос. Усильте его вариантами и проверяемыми критериями.'), choice('Ваши внутренние проблемы меня не касаются. Мне нужен результат.', 'Давление', 3, -18, 'Игнорирование ограничений снижает доверие и готовность искать решение.')],
 [choice(supplier ? 'Предлагаю годовой контракт, гарантированный объём и ускоренную оплату в обмен на рост цены не более 5%.' : 'Предлагаю ведущую роль сейчас и рост на 15% либо пересмотр через три месяца по согласованным KPI.', 'Взаимный обмен', 19, 10, 'Вы собрали пакет условий и связали уступки со встречной ценностью.'), choice(supplier ? 'Можем согласиться на 10%, если это упростит решение.' : 'Согласен на небольшую прибавку, детали можно обсудить потом.', 'Односторонний компромисс', 11, 3, 'Компромисс возможен, но уступка без встречного условия ослабляет позицию.'), choice('Это моё последнее предложение. Обсуждать больше нечего.', 'Давление', 3, -20, 'Жёсткая позиция без аргументов блокирует совместный поиск.')],
 [choice(supplier ? 'Понимаю риск по объёму. Давайте добавим квартальный коридор и пересмотр цены, если объём отклонится больше чем на 10%.' : 'Понимаю риск бюджета. Давайте ограничим пилот тремя месяцами и заранее согласуем измеримые критерии результата.', 'Работа с риском', 17, 10, 'Вы признали возражение и предложили механизм, который снижает риск собеседника.'), choice('Какая часть предложения вызывает у вас больше всего сомнений?', 'Диагностика возражения', 12, 6, 'Вы уточняете причину сомнений, но следующему ходу понадобится конкретное решение.'), choice('Вы просто ищете повод отказать. Это несерьёзно.', 'Обесценивание', 2, -19, 'Обесценивание возражения усиливает сопротивление и разрушает рабочий контакт.')],
 [choice(supplier ? 'Зафиксируем цену, объём, коридор отклонения и сроки поставок письменно. Сверим проект договора в пятницу?' : 'Зафиксируем роль, KPI, ресурсы и дату пересмотра через три месяца. Я отправлю итоги встречи сегодня.', 'Фиксация', 18, 10, 'Конкретные условия, ответственный и срок превращают разговор в проверяемую договорённость.'), choice('Спасибо, давайте вернёмся к этому позже.', 'Отсрочка', 8, 0, 'Без даты и ответственного обсуждение может не привести к действию.'), choice('Отлично, считаю, что вы согласились со всем.', 'Допущение', 3, -10, 'Проверьте согласие собеседника, прежде чем объявлять о договорённости.')]
 ][Math.min(stage, SESSION_STAGE_COUNT - 1)];
}

type TextSignals = {
 meaningfulWords:number;
 openQuestion:boolean;
 checkQuestion:boolean;
 empathy:boolean;
 acknowledgesOther:boolean;
 collaboration:boolean;
 mutualValue:boolean;
 selfPosition:boolean;
 otherPosition:boolean;
 boundary:boolean;
 interests:boolean;
 reasons:boolean;
 alternatives:boolean;
 proposal:boolean;
 reciprocity:boolean;
 counterpartValue:boolean;
 objection:boolean;
 mitigation:boolean;
 contingency:boolean;
 closing:boolean;
 written:boolean;
 owner:boolean;
 deadline:boolean;
 confirms:boolean;
 termGroups:number;
 domainRelevant:boolean;
};

type StageAssessment = {
 skill:string;
 intent:NegotiationIntent;
 points:number;
 strengths:string[];
 improvements:string[];
};

const STAGE_MAX=[17,17,19,19,17,18] as const;
const SPEECH_FILLERS=/(?<![\p{L}\p{N}_])(?:ну|ээ+|эм+|как бы|в общем|короче|значит|вот|скажем так|так сказать)(?![\p{L}\p{N}_])/gu;
const UNICODE_WORD_BOUNDARY='(?:(?<![\\p{L}\\p{N}_])(?=[\\p{L}\\p{N}_])|(?<=[\\p{L}\\p{N}_])(?![\\p{L}\\p{N}_]))';

function normalizeNegotiationText(value:string) {
 return value.normalize('NFKC').toLowerCase().replace(/ё/g,'е').replace(/[«»“”]/g,'"').replace(/[—–]/g,'-').replace(/\s+/g,' ').trim();
}

function countTrue(values:boolean[]) { return values.reduce((sum,value)=>sum+(value?1:0),0); }
function semanticMatch(text:string,pattern:RegExp) {
 const flags=pattern.flags.replace('g','');
 return new RegExp(pattern.source.replaceAll('\\b',UNICODE_WORD_BOUNDARY),flags.includes('u')?flags:`${flags}u`).test(text);
}

function detectSignals(text:string,domain:Domain):TextSignals {
 const speech=text.replace(SPEECH_FILLERS,' ').replace(/\s+/g,' ').trim();
 const words=speech.match(/[a-zа-я0-9%]+/giu)??[];
 const openQuestion=semanticMatch(speech,/\b(?:какие|какой|какая|почему|зачем|сколько|когда)\b|\bкак (?:вы|мы|это|лучше|можно)\b|\bчто (?:для вас|вам|сильнее|мешает|нужно|важнее|повлияет)\b|\bрасскаж(?:ите|и)|\bпоможет ли\b|\bможем ли\b/u);
 const checkQuestion=semanticMatch(speech,/\b(?:правильно|верно) ли (?:я |мы )?(?:понима|зафиксир)|\bправильно (?:ли )?(?:я |мы )?понима|\bдавайте сверим|\bсверим (?:позиции|условия|понимание)|\bуточню[: ,]/u);
 const rejectsUnderstanding=semanticMatch(speech,/\b(?:не понимаю|не вижу|мне безразлично|мне все равно)/u);
 const empathy=!rejectsUnderstanding&&semanticMatch(speech,/\b(?:понимаю|вижу,? что|слышу,? что|признаю|ценю|спасибо за|учитываю|согласен,? что)/u);
 const acknowledgesOther=!rejectsUnderstanding&&semanticMatch(speech,/\b(?:понимаю|вижу|слышу|признаю|учитываю)[, ]+(?:что|ваш|вашу|ваши)|\b(?:для вас|вам важно|ваша позици|ваши услов|ваш интерес|ваша цель|вы хотите|вы предлагаете|вас беспокоит)/u);
 const collaboration=!semanticMatch(speech,/\b(?:не хочу|не будем|не готов) (?:обсуждать|искать|продолжать)/u)&&semanticMatch(speech,/\b(?:давайте|вместе|готов(?:ы)? обсудить|найд[её]м решение|найти решение|поиск решения|продолжить диалог|разобраться вместе|сверим)/u);
 const mutualValue=semanticMatch(speech,/\b(?:обеих сторон|для обеих|взаимн|и для вас,? и для нас|сохранить (?:сотрудничество|отношения)|общая цель|интересы команды|усилит (?:команду|сотрудничество))/u);
 const selfPosition=semanticMatch(speech,/\b(?:наша позици|моя позици|для нас|нам важно|мы готовы|мы можем|я рассчитываю|моя цель|наш(?:и|) предел|для меня|нам приемлем|я хочу)/u);
 const otherPosition=semanticMatch(speech,/\b(?:ваша позици|ваши услов|для вас|вам важно|вы хотите|вы предлагаете|ваша цель|вам нужен|вам требуется)/u);
 const boundary=semanticMatch(speech,/\b(?:не более|не меньше|в пределах|огранич|бюджет|максим|миним|приемлем|предел|рамк|красная линия|услови)/u);
 const interests=semanticMatch(speech,/\b(?:интерес|приоритет|важн|потребност|цель|мотивац|опасени|ожидани|что вы хотите|что вам нужно)/u);
 const reasons=semanticMatch(speech,/\b(?:почему|причин|что (?:сильнее )?влияет|из-за чего|ограничени|что мешает|что стоит за|риск|обоснов|основани)/u);
 const alternatives=semanticMatch(speech,/\b(?:вариант|альтернатив|либо|или|что если|при каком условии|какие еще|иначе можно|несколько решений)/u);
 const proposal=!semanticMatch(speech,/\bне предлага/u)&&semanticMatch(speech,/\b(?:предлага|готов(?:ы)?|можем|давайте (?:добавим|зафиксируем|согласуем|сделаем)|обязуем|бер[её]м на себя|вариант такой)/u);
 const reciprocity=semanticMatch(speech,/\b(?:в обмен на|если .{2,80},? то|при условии|со своей стороны|встречн|взамен|за это|с вашей стороны)/u);
 const counterpartValue=semanticMatch(speech,/\b(?:для вас это|вам даст|снизит ваш|снимет ваш|сохранит|гарантирует вам|гарантированн(?:ый|ого) объем|учтет ваши|вы получите|поможет вам|ваша выгода)/u);
 const objection=semanticMatch(speech,/\b(?:понимаю|вижу|признаю|учитываю)[^.!?]{0,35}\b(?:риск|опасени|сомнени|возражени|ограничени|бюджет)|\b(?:вас беспокоит|главное возражение|риск для вас)/u);
 const mitigation=semanticMatch(speech,/\b(?:снизить риск|снять риск|чтобы избежать|решим это|механизм|коридор|пилот|гаранти|страхов|этапн|контрольн|пересмотр|компенсир|защит)/u);
 const contingency=semanticMatch(speech,/\b(?:если|при отклонении|в случае|при условии|по итогам|после проверки|при достижении|в зависимости от)/u);
 const closing=semanticMatch(speech,/\b(?:зафиксир|подведем итог|итак,?|договорились|согласуем|закрепим|следующий шаг|резюмир|оформим)/u);
 const written=semanticMatch(speech,/\b(?:письмен|письмо|договор|протокол|резюме встречи|проект|документ|итоги встречи)/u);
 const owner=semanticMatch(speech,/\b(?:я отправлю|я подготовлю|мы отправим|мы подготовим|вы направите|ответственн|кто делает|беру на себя|назначим|со своей стороны)/u);
 const deadline=semanticMatch(speech,/\b(?:сегодня|завтра|в пятниц|до [а-я0-9]|через \w+ (?:дн|недел|месяц)|дата|срок|к \d|\d{1,2}[./]\d{1,2})/u);
 const confirms=semanticMatch(speech,/\b(?:подтвердите|верно ли зафиксир|правильно ли зафиксир|согласны ли|все верно|ничего не упустили|сверим итог|подтверждаете)/u);
 const termPatterns=[
  /(?:\d|\b(?:один|два|три|четыре|пять|шесть|семь|восемь|девять|десять)\b)[\w ]{0,12}(?:%|процент|рубл|тысяч|миллион)?/u,
  /\b(?:цен|стоимост|скидк|зарплат|бюджет|марж|оплат|аванс)/u,
  /\b(?:объем|поставк|партия|контракт|заказ|график)/u,
  /\b(?:роль|ответственност|задач|полномочи|ресурс|команд)/u,
  /\b(?:kpi|кпи|критери|показател|результат|метрик)/u,
  /\b(?:срок|дата|день|недел|месяц|квартал|год|сегодня|завтра|пятниц)/u,
 ];
 const domainPattern=domain==='supplier'?/\b(?:себестоимост|марж|объем|поставк|оплат|контракт|цен)/u:/\b(?:роль|зарплат|kpi|кпи|ответственност|команд|проект|результат)/u;
 const termGroups=countTrue(termPatterns.map(pattern=>semanticMatch(speech,pattern)));const domainRelevant=semanticMatch(speech,domainPattern);
 return {meaningfulWords:words.length,openQuestion,checkQuestion,empathy,acknowledgesOther,collaboration,mutualValue,selfPosition,otherPosition,boundary,interests,reasons,alternatives,proposal,reciprocity,counterpartValue,objection,mitigation,contingency,closing,written,owner,deadline,confirms,termGroups,domainRelevant};
}

function assessStage(stage:number,s:TextSignals):StageAssessment {
 const current=Math.max(0,Math.min(stage,SESSION_STAGE_COUNT-1));
 let raw=3;let skill='Уточнение';let intent:NegotiationIntent='scripted';const strengths:string[]=[];const improvements:string[]=[];
 const add=(condition:boolean,points:number,label:string)=>{if(condition){raw+=points;strengths.push(label)}};
 if(current===0){
  skill='Контакт';
  add(s.empathy,4,'эмпатия');add(s.acknowledgesOther,3,'признание позиции собеседника');add(s.collaboration,4,'приглашение к диалогу');add(s.mutualValue,3,'общая ценность');
  if(!s.empathy&&!s.acknowledgesOther)improvements.push('Признайте позицию или переживание собеседника.');
  if(!s.collaboration)improvements.push('Предложите вместе искать решение.');
  if(!s.mutualValue)improvements.push('Назовите общую цель или ценность отношений.');
 }else if(current===1){
  skill='Рамка разговора';intent=s.openQuestion||s.checkQuestion?'question':'scripted';
  add(s.checkQuestion,4,'проверка понимания');add(s.selfPosition,3,'ваша позиция');add(s.otherPosition,3,'позиция собеседника');add(s.boundary,3,'границы и ограничения');add(s.openQuestion,2,'вопрос на сверку');
  if(!s.selfPosition||!s.otherPosition)improvements.push('Обозначьте позиции обеих сторон, не подменяя одну другой.');
  if(!s.checkQuestion&&!s.openQuestion)improvements.push('Проверьте, одинаково ли вы понимаете условия и ограничения.');
  if(!s.boundary)improvements.push('Добавьте конкретную границу, критерий или ограничение.');
 }else if(current===2){
  skill='Интересы';intent='question';
  add(s.openQuestion,4,'открытый вопрос');add(s.interests,4,'фокус на интересах');add(s.reasons,3,'поиск причин и ограничений');add(s.alternatives||s.termGroups>=2,3,'исследование нескольких параметров');add(s.domainRelevant,2,'предметная область вопроса');
  if(!s.openQuestion)improvements.push('Задайте открытый вопрос, на который нельзя ответить только «да» или «нет».');
  if(!s.interests&&!s.reasons)improvements.push('Спросите о приоритетах, причинах или скрытых ограничениях.');
  if(!s.alternatives&&s.termGroups<1)improvements.push('Предложите несколько осей для ответа: срок, объём, ресурсы или критерии.');
 }else if(current===3){
  skill='Взаимный обмен';intent='proposal';
  add(s.proposal,3,'ясное предложение');add(s.termGroups>=2,4,'несколько конкретных условий');add(s.reciprocity,5,'встречный обмен');add(s.counterpartValue||s.mutualValue,3,'ценность для второй стороны');add(s.alternatives||s.contingency,2,'вариативность условий');
  if(!s.proposal)improvements.push('Сформулируйте предложение как конкретный следующий ход.');
  if(s.termGroups<2)improvements.push('Свяжите минимум два условия: цену, срок, объём, роль, KPI или ресурсы.');
  if(!s.reciprocity)improvements.push('Покажите обмен: что вы даёте и что ожидаете взамен.');
 }else if(current===4){
  skill='Работа с возражением';intent=s.mitigation?'proposal':'question';
  add(s.objection,4,'признание возражения');add(s.openQuestion,3,'диагностика сомнения');add(s.mitigation,4,'механизм снижения риска');add(s.contingency,3,'условие пересмотра');add(s.termGroups>=2,2,'проверяемые параметры');
  if(!s.objection)improvements.push('Сначала назовите риск или сомнение собеседника своими словами.');
  if(!s.openQuestion&&!s.mitigation)improvements.push('Уточните причину возражения или предложите способ снизить риск.');
  if(!s.contingency&&s.termGroups<2)improvements.push('Добавьте проверяемый механизм: пилот, критерий, коридор или дату пересмотра.');
 }else{
  skill='Фиксация';intent='commitment';
  add(s.closing,4,'фиксация итога');add(s.termGroups>=2,3,'конкретные условия');add(s.written,2,'письменное подтверждение');add(s.owner,3,'ответственный');add(s.deadline,3,'срок');add(s.confirms,2,'проверка согласия');
  if(!s.closing)improvements.push('Кратко зафиксируйте, о чём договорились.');
  if(!s.owner||!s.deadline)improvements.push('Назовите ответственного и срок следующего шага.');
  if(!s.written&&!s.confirms)improvements.push('Предложите письменное подтверждение или проверьте согласие второй стороны.');
 }
 const evidenceCap=strengths.length===0?8:strengths.length===1?11:strengths.length===2?14:STAGE_MAX[current];
 const lengthCap=s.meaningfulWords<3?7:s.meaningfulWords<6?11:STAGE_MAX[current];
 return {skill,intent,points:Math.max(3,Math.min(raw,evidenceCap,lengthCap,STAGE_MAX[current])),strengths,improvements};
}

export function evaluateText(text: string, domain: Domain, stage: number): Choice {
 const clean = text.trim();
 const t = normalizeNegotiationText(clean);
 const make = (skill:string,points:number,trust:number,feedback:string,tensionDelta:number,intent:NegotiationIntent):Choice => ({text:clean,skill,points,trust,feedback,tension:tensionDelta,intent});
 if (/(?:на\s*хуй|нахуй|хуесос|хуй|хуйн|еба|ебан|ебл|пизд|мудак|дебил|идиот|туп(?:ой|ая|ые)|ублюд|мраз|говн|заткнись|пош[её]л|придур|урод|лох)/i.test(clean)) {
  return make('Оскорбление',0,-32,'Оскорбление мгновенно разрушает рабочий контакт. Остановитесь, признайте срыв и верните разговор к предметным условиям.',50,'insult');
 }
 if (/(извин|прошу прощ|сорвался|был неправ|вернемся к конструктив|давайте начнем заново)/.test(t)) {
  return make('Восстановление контакта',12,7,'Вы признали сбой и предложили вернуться к делу. После конфликта добавьте конкретный спокойный вопрос.',-10,'repair');
 }
 if (/(иначе|ультиматум|обязаны|последнее предложение|только согласие|не будете|мы уйдем|я уйду|никаких обсуждений)/.test(t)) {
  return make('Ультиматум',2,-23,'Угроза заставляет собеседника защищаться и резко приближает срыв сделки.',34,'threat');
 }
 if (semanticMatch(t,/\b(?:ваши проблемы меня не|меня не волнует|мне не важно|не касается|это несерьезно|вы просто ищете повод|обсуждать нечего|не вижу смысла обсуждать)/u)) {
  return make('Обесценивание',2,-20,'Вы отвергли интересы или возражение второй стороны. Такой ход усиливает сопротивление и не решает задачу этапа.',28,'demand');
 }
 const signals=detectSignals(t,domain);
 const hasSemanticEvidence=Object.values(signals).some(value=>value===true)||signals.termGroups>0;
 const isDemand=/(требую|дайте|снижайте|повышайте|мне нужно|мне нужен|вы должны|согласитесь|принимайте)/.test(t);
 if (/^(?:хорошо[, ]*)?(?:я |мы )?(?:согласен|согласны|принимаю|принимаем)(?: со всем| на все| любые условия| ваши условия)[.! ]*$/.test(t)) {
  return make('Безусловная уступка',5,2,'Согласие без проверки условий сохраняет спокойствие, но лишает вас переговорной позиции. Уточните предмет, границы и встречное обязательство.',7,'vague');
 }
 if ((signals.meaningfulWords<4&&!hasSemanticEvidence) || /^(?:ладно|хорошо|не знаю|решайте|думайте|просто сделайте|ну и что)[.! ]*$/.test(t)) {
  return make('Без конкретики',5,-5,'Собеседнику не за что зацепиться: нет вопроса, условия или следующего шага. Напряжённость растёт из-за неопределённости.',14,'vague');
 }
 if (isDemand&&!signals.mutualValue&&!signals.reciprocity&&!signals.openQuestion) {
  return make('Одностороннее требование',5,-10,'Требование обозначает вашу позицию, но не даёт собеседнику встречной ценности или выбора.',19,'demand');
 }
 const assessment=assessStage(stage,signals);const maximum=STAGE_MAX[Math.max(0,Math.min(stage,SESSION_STAGE_COUNT-1))];const quality=assessment.points/maximum;
 const trust=quality>=.85?10:quality>=.68?6:quality>=.5?2:-4;
 const tensionDelta=quality>=.85?-9:quality>=.68?-4:quality>=.5?4:11;
 const positive=assessment.strengths.length?`Сработало: ${assessment.strengths.slice(0,3).join(', ')}.`:'Ход пока не решает задачу этого этапа.';
 const advice=assessment.improvements[0]??'Формулировка сочетает несколько сильных элементов этапа.';
 const intent=assessment.points<=7&&!signals.openQuestion&&!signals.proposal?'vague':assessment.intent;
 return make(assessment.skill,assessment.points,trust,`${positive} ${advice}`,tensionDelta,intent);
}
export function threshold(config: Config) { return { 'Базовый': 52, 'Продвинутый': 65, 'Эксперт': 78 }[config.difficulty]; }
export function respond(config: Config, stage: number, c: Choice, trust: number): string {
 if(c.intent==='insult') return 'Я не готов продолжать разговор в таком тоне. Если вы хотите сохранить возможность сделки, остановимся и вернёмся к уважительному обсуждению конкретных условий.';
 if(c.intent==='threat') return 'Ультиматум не даёт мне оснований двигаться навстречу. Либо обсудим ограничения и встречные обязательства, либо придётся поставить переговоры на паузу.';
 if(c.intent==='vague') return config.domain==='supplier'?'Пока я не услышал конкретного предложения. Назовите цену, объём, срок и то, что вы готовы гарантировать со своей стороны.':'Пока неясно, что именно вы предлагаете. Сформулируйте роль, измеримый результат и срок, после которого мы проверим договорённость.';
 if(c.intent==='demand') return 'Я услышал вашу позицию, но одностороннее требование не решает моих ограничений. Что вы предлагаете взамен и какой риск готовы взять на себя?';
 if(c.intent==='repair') return 'Спасибо, что остановились и вернули разговор в рабочее русло. Я готов продолжить, если дальше мы будем обсуждать конкретные условия и интересы обеих сторон.';
 const prefix = config.tone === 'Жёсткий' ? 'Перейдём к делу. ' : config.tone === 'Дружелюбный' ? 'Спасибо за открытый разговор. ' : '';
 if (trust < 25) return prefix+'В таком тоне договориться сложно. Мне нужны конструктивные условия, иначе остановим обсуждение.';
 const lines = config.domain === 'supplier' ? [
  'Я тоже заинтересован сохранить отношения. Но рост себестоимости реален, поэтому нам понадобится предметный обмен условиями.',
  'Да, позиции обозначены верно. Кроме цены для нас важны прогнозируемая загрузка, сроки оплаты и защита от резкого падения объёма.',
  'Гарантированный объём действительно снижает риск. Если он будет закреплён, мы сможем обсуждать меньший рост и более длинный горизонт.',
  c.points >= 17 ? 'Такой пакет уже выглядит сбалансированнее. Мне нужно понять, как вы гарантируете объём и что произойдёт при отклонении от прогноза.' : 'Пока я вижу уступку только с нашей стороны. Нужны встречные обязательства по объёму, сроку или оплате.',
  c.points >= 17 ? 'Коридор по объёму снимает основное возражение. При отклонении можно включить пересмотр, не разрушая весь контракт.' : 'Риск недозагрузки всё ещё остаётся на нас. Без механизма пересмотра я не смогу согласовать цену.',
  'Готов сверить формулировки и назначить ответственных. Если цифры совпадут с тем, что обсудили, вынесу проект на согласование в пятницу.',
 ] : [
  'Я готов обсудить ваш следующий шаг. Мне важно связать новую роль с задачами команды и понятным результатом.',
  'Сейчас возможности бюджета ограничены, но вопрос не только в деньгах. Нужен план новой ответственности и передача текущих задач.',
  'Для обоснования нужны измеримые результаты, зона решений и срок проверки. Мой приоритет — не перегрузить команду и удержать темп.',
  c.points >= 17 ? 'Пилот и заранее согласованные KPI выглядят реалистично. Давайте разберём, какие ресурсы вам нужны и кто примет текущие задачи.' : 'Мне пока недостаточно оснований для изменения роли. Нужна связь между результатом, ответственностью и сроком пересмотра.',
  c.points >= 17 ? 'Трёхмесячный период снижает риск для бюджета. Если критерии прозрачны, я смогу защитить решение перед руководством.' : 'Главное возражение остаётся: результат нельзя проверить. Без критериев и срока я не смогу обещать пересмотр.',
  'Давайте зафиксируем KPI, ресурсы и дату контрольной встречи. После письма я подтвержу договорённости и запущу согласование.',
 ];
 return prefix+lines[Math.min(stage, SESSION_STAGE_COUNT - 1)]+(stage === 2 ? ` Мой приоритет: ${config.goal.toLowerCase()}.` : '');
}
export function outcome(config: Config, turns: Turn[], requiredTurns = SESSION_STAGE_COUNT) {
 const count = Math.max(1, Math.min(requiredTurns, SESSION_STAGE_COUNT));
 const maximum = Array.from({length:count},(_,stage)=>Math.max(...choices(config.domain,stage).map(item=>item.points))).reduce((sum,value)=>sum+value,0);
 const raw = turns.slice(0,count).reduce((sum,turn)=>sum+turn.points,0);
 const score = Math.max(0,Math.min(100,Math.round(raw/maximum*100)));
 const trust = Math.max(0, Math.min(100,50+turns.reduce((s,t)=>s+t.trust,0)));
 const collapsed=tension(config,turns)>=100;
 return {score,trust,collapsed,won:!collapsed&&turns.length===count&&score>=threshold(config)&&trust>=40};
}

/** Emotional pressure is distinct from trust: concessions do not resolve uncertainty. */
export function tension(config: Config, turns: Turn[]) {
 const baseline = {Дружелюбный: 24, Сдержанный: 36, Жёсткий: 48}[config.tone]
   + {Базовый: 0, Продвинутый: 5, Эксперт: 10}[config.difficulty];
 return turns.reduce((value, turn) => {
   const delta = typeof turn.tension==='number' ? turn.tension : turn.trust < 0 ? Math.ceil(Math.abs(turn.trust) * 1.4)
     : turn.points >= 19 ? -14 : turn.points >= 12 ? -5 : 5;
   return Math.max(5, Math.min(100, value + delta));
 }, baseline);
}
export function tensionState(value: number) {
 if (value >= 70) return {label: 'На грани срыва', hint: 'Снизьте давление. Признайте интерес собеседника и задайте открытый вопрос.', color: '#d56d59', level: 'high'};
 if (value >= 45) return {label: 'Осторожный диалог', hint: 'Добавьте конкретики и покажите, что учитываете обе стороны.', color: '#ba9552', level: 'medium'};
 return {label: 'Есть контакт', hint: 'Собеседник открыт к обсуждению. Продолжайте искать взаимную выгоду.', color: '#76a68a', level: 'low'};
}
