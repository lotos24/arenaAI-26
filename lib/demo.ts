import { Config } from './engine';
import { SCENARIO_PRESETS } from './scenario-library';

/** One move of the demo: typed free text or an answer option found by its words. */
export type DemoStep = { caption: string } & ({ kind: 'say'; text: string } | { kind: 'pick'; phrase: string });

/** The customer case, so the demo shows the partner's own scenario. */
export const DEMO_CONFIG: Config = SCENARIO_PRESETS.find(preset => preset.id === 'alabuga-polytech')!.config;

/**
 * A one-minute route through the method: an interest question earns a clue, the clue reveals the interest,
 * pressure raises tension, contact is repaired, a package with a risk mechanism, and a fixed agreement.
 */
export const DEMO_ROUTE: DemoStep[] = [
  { kind: 'say', caption: 'Открытый вопрос об интересах: собеседник даёт зацепку', text: 'Добрый день, Алина. Спасибо, что нашли время. Скажите, что для вас важнее всего в работе со студентами?' },
  { kind: 'say', caption: 'Подхваченная зацепка раскрывает скрытый интерес', text: 'Правильно ли я понимаю, что служебное жильё в Елабуге для вас важно, а мне нужно сохранить работу на заводе не меньше трёх дней в неделю?' },
  { kind: 'pick', caption: 'Давление: напряжённость растёт, собеседник закрывается', phrase: 'меня не касаются' },
  { kind: 'say', caption: 'Восстановление контакта после срыва', text: 'Прошу прощения, я перегнул. Давайте вернёмся к делу: что для вас будет показателем успеха через год?' },
  { kind: 'say', caption: 'Пакет условий и механизм снижения риска', text: 'Понимаю ваш риск, что наставник с завода не потянет нагрузку. Предлагаю пилот на семестр: два дня в неделю в Политехе в обмен на жильё и свободу в программе, а если трудоустройство выпускников вырастет, продлим контракт.' },
  { kind: 'say', caption: 'Фиксация: условия, ответственный и срок', text: 'Итак: два дня в неделю, служебное жильё, авторская программа и пилот на семестр. Я отправлю протокол до пятницы — подтвердите, всё ли верно?' },
];
