'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';

export type TourStep = { target: string; title: string; text: string };
export type TourId = 'home' | 'session' | 'results';

const SEEN_KEY = (id: TourId) => `arena-tour-${id}`;
export function tourSeen(id: TourId) { try { return localStorage.getItem(SEEN_KEY(id)) === 'done'; } catch { return true; } }
export function markTourSeen(id: TourId) { try { localStorage.setItem(SEEN_KEY(id), 'done'); } catch { /* private mode: the tour may repeat */ } }

const visibleTarget = (selector: string) => {
  const element = document.querySelector<HTMLElement>(selector);
  return element && element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden' ? element : null;
};

/**
 * Guided tour: dims the page, highlights one element at a time and explains it next to it.
 * Steps whose element is not on screen (the sidebar on a phone, a panel of another state) are skipped.
 */
export function Tour({ steps, onClose, onAbort }: { steps: TourStep[]; onClose: () => void; onAbort: () => void }) {
  const [shown, setShown] = useState(() => steps.filter(step => visibleTarget(step.target)));
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const card = useRef<HTMLDivElement>(null);
  const next = useRef<HTMLButtonElement>(null);
  const step = shown[index];

  // The screen may still be animating in: wait for its elements, and give up without marking the tour as seen.
  useEffect(() => {
    if (shown.length) return;
    let attempts = 0;
    const timer = setInterval(() => {
      const found = steps.filter(step => visibleTarget(step.target));
      if (found.length) { clearInterval(timer); setShown(found); }
      else if (++attempts >= 12) { clearInterval(timer); onAbort(); }
    }, 250);
    return () => clearInterval(timer);
  }, [shown, steps, onAbort]);
  // Bring the element into view, then follow it while layout settles (animations, scroll, resize).
  useEffect(() => {
    if (!step) return;
    const element = visibleTarget(step.target);
    element?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    let frame = 0;
    let last = '';
    const follow = () => {
      const target = visibleTarget(step.target);
      const box = target ? target.getBoundingClientRect() : null;
      const key = box ? `${Math.round(box.left)},${Math.round(box.top)},${Math.round(box.width)},${Math.round(box.height)},${innerWidth},${innerHeight}` : `none,${innerWidth},${innerHeight}`;
      // Re-render only when the element or the window actually moved.
      if (key !== last) { last = key; setRect(box); setSize({ width: innerWidth, height: innerHeight }); }
      frame = requestAnimationFrame(follow);
    };
    follow();
    next.current?.focus({ preventScroll: true });
    return () => cancelAnimationFrame(frame);
  }, [step]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
      else if (event.key === 'ArrowRight') { event.preventDefault(); forward(); }
      else if (event.key === 'ArrowLeft') { event.preventDefault(); setIndex(value => Math.max(0, value - 1)); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  const [cardHeight, setCardHeight] = useState(180);
  useLayoutEffect(() => { if (card.current) setCardHeight(card.current.offsetHeight); }, [index, size.width]);
  if (!step) return null;
  function forward() { if (index >= shown.length - 1) onClose(); else setIndex(index + 1); }

  // The card sits under the element when there is room, above it otherwise, and stays inside the window.
  const gap = 14;
  const width = Math.min(360, size.width - 32);
  const spot = rect ? { left: rect.left - 6, top: rect.top - 6, width: rect.width + 12, height: rect.height + 12 } : null;
  const below = spot ? spot.top + spot.height + gap : 0;
  const top = !spot ? (size.height - cardHeight) / 2
    : below + cardHeight <= size.height - 12 ? below
    : spot.top - gap - cardHeight >= 12 ? spot.top - gap - cardHeight
    : Math.max(12, size.height - cardHeight - 12);
  const left = spot ? Math.min(Math.max(16, spot.left + spot.width / 2 - width / 2), size.width - width - 16) : (size.width - width) / 2;

  return <div className="tour" role="dialog" aria-modal="true" aria-labelledby="tour-title">
    <div className="tour-backdrop" onClick={forward}/>
    {spot ? <div className="tour-spot" style={spot}/> : <div className="tour-dim"/>}
    <motion.div ref={card} key={index} className="tour-card" style={{ width, left, top }} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <div className="tour-head"><span>Шаг {index + 1} из {shown.length}</span><button type="button" className="tour-close" aria-label="Закончить тур" onClick={onClose}><X size={16}/></button></div>
      <h2 id="tour-title">{step.title}</h2>
      <p>{step.text}</p>
      <div className="tour-progress" aria-hidden="true">{shown.map((_, i) => <i key={i} className={i === index ? 'active' : i < index ? 'done' : ''}/>)}</div>
      <div className="tour-actions">
        <button type="button" className="text-button" onClick={onClose}>Пропустить</button>
        <span>
          {index > 0 && <button type="button" className="icon-button" aria-label="Назад" onClick={() => setIndex(index - 1)}><ArrowLeft size={16}/></button>}
          <button ref={next} type="button" className="button primary tour-next" onClick={forward}>{index >= shown.length - 1 ? 'Понятно' : 'Далее'} <ArrowRight size={15}/></button>
        </span>
      </div>
    </motion.div>
  </div>;
}

export const HOME_TOUR: TourStep[] = [
  { target: '.first-steps', title: 'С чего начать', text: 'Три лучших входа: демо, которое сыграет само, мягкая первая встреча и кейс заказчика — ОЭЗ «Алабуга».' },
  { target: '.negotiation-map', title: 'Карта переговоров', text: 'Десять встреч от городских до совета директоров. Кейсы «Алабуги» и первая встреча открыты сразу, остальные открываются с ростом звания.' },
  { target: '.custom-banner', title: 'Свой сценарий', text: 'Тема, роль, цель, тон и сложность: соберите встречу под свою задачу или откройте готовый кейс из библиотеки.' },
  { target: '[data-nav="progress"]', title: 'Прогресс', text: 'Звания, опыт, матрица компетенций, достижения и история всех встреч с разбором.' },
  { target: '[data-nav="admin"]', title: 'Администратор / Конструктор', text: 'Контур администратора: библиотека кейсов, импорт и экспорт в JSON, скрытые интересы собеседника.' },
  { target: '[data-nav="settings"]', title: 'Настройки', text: 'Локальная нейросеть, голос собеседника, звуки, таймер давления, профиль ученика и вход преподавателя.' },
  { target: '.ai-status', title: 'Режим собеседника', text: 'Сценарный режим работает сразу и без интернета. Нейросеть включается в настройках и работает прямо в браузере — без серверов и ключей.' },
  { target: '.tour-launch', title: 'Помощь всегда рядом', text: 'Эта кнопка снова покажет тур по текущему экрану, а «?» — легенду арены.' },
];
export const SESSION_TOUR: TourStep[] = [
  { target: '.opponent', title: 'Ваш собеседник', text: 'Имя, роль и настроение. У него три скрытых интереса — их раскрывают вопросы о том, что стоит за позицией.' },
  { target: '.session-sidebar .tension-meter', title: 'Напряжённость', text: 'Растёт от давления и ультиматумов, падает от понимания и обмена. На 70% собеседник торопит таймером, на 100% сделка срывается.' },
  { target: '.mobile-tension', title: 'Напряжённость', text: 'Растёт от давления и ультиматумов, падает от понимания и обмена. На 70% собеседник торопит таймером, на 100% сделка срывается.' },
  { target: '.choice-tray', title: 'Варианты ответа', text: 'Три тактики этапа. Среди них есть ловушки, а порядок каждый раз другой — читайте, а не жмите первый.' },
  { target: '.input-row', title: 'Свой ответ', text: 'Пишите своими словами или говорите в микрофон: собеседник ответит на ваш вопрос, цифру или предложение.' },
  { target: '.coach-button', title: 'Подсказка коуча', text: 'Метод текущего этапа — без готового ответа.' },
  { target: '.session-stage-list', title: 'Шесть этапов', text: 'Контакт → позиции → интересы → пакет условий → возражение → фиксация.' },
  { target: '.interest-panel', title: 'Скрытые интересы', text: 'Здесь появляется всё, что вы узнали о собеседнике. Каждый раскрытый интерес добавляет доверия.' },
];
export const RESULTS_TOUR: TourStep[] = [
  { target: '.deal-tab', title: 'Итог сделки', text: 'Что договорились — словами из ваших реплик — и какой ценой: уступки без обмена, давление, упущенные интересы.' },
  { target: '.judges-tab', title: 'Три судьи', text: '«Пошёл бы работать», «отправил бы на переговоры», «доверил бы ресурсы». Каждый вердикт подтверждён вашей цитатой и её эффектом.' },
  { target: '.review-tabs button[title]', title: 'Разбор каждого хода', text: 'Ваша реплика со временем, что сработало и как сделать её сильнее.' },
  { target: '.memo-button', title: 'Памятка', text: 'Весь разбор одним текстом — для себя или для преподавателя.' },
  { target: '.result-footer .button.primary', title: 'Попробовать иначе', text: 'Честный повтор: тот же собеседник и те же скрытые условия — изменится только ваша стратегия.' },
];
