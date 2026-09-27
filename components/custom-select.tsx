'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';

export type SelectOption<T extends string> = {
  value: T;
  label: string;
  description?: string;
};

type Props<T extends string> = {
  value: T;
  options: readonly SelectOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  disabled?: boolean;
};

export function CustomSelect<T extends string>({ value, options, onChange, ariaLabel, disabled = false }: Props<T>) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 240 });
  const selected = useMemo(() => options.find(option => option.value === value) ?? options[0], [options, value]);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const update = () => {
      const rect = root.current?.getBoundingClientRect();
      if (!rect) return;
      const estimated = Math.min(options.length * 58 + 12, 286);
      const roomBelow = window.innerHeight - rect.bottom;
      const top = roomBelow >= estimated + 12 ? rect.bottom + 8 : Math.max(8, rect.top - estimated - 8);
      setPosition({ top, left: Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8)), width: rect.width });
    };
    const close = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!root.current?.contains(target) && !menu.current?.contains(target)) setOpen(false);
    };
    update();
    document.addEventListener('pointerdown', close);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    const focusTimer = window.setTimeout(() => menu.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus(), 40);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('pointerdown', close);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, options.length]);

  function moveFocus(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      root.current?.querySelector<HTMLElement>('button')?.focus();
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const items = [...(menu.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])];
    const current = items.indexOf(document.activeElement as HTMLElement);
    const next = event.key === 'ArrowDown'
      ? (current + 1 + items.length) % items.length
      : (current - 1 + items.length) % items.length;
    items[next]?.focus();
  }

  const popover = (
    <AnimatePresence>
      {open && <motion.div
        ref={menu}
        id={`${id}-listbox`}
        className={`custom-select-popover ${document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'}`}
        role="listbox"
        aria-label={ariaLabel}
        style={{ top: position.top, left: position.left, width: position.width }}
        initial={{ opacity: 0, y: -7, scale: .97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -5, scale: .98 }}
        transition={{ duration: .2, ease: [.22, 1, .36, 1] }}
        onKeyDown={moveFocus}
      >
        {options.map((option, index) => <motion.button
          type="button"
          role="option"
          data-value={option.value}
          aria-selected={option.value === value}
          tabIndex={option.value === value ? 0 : -1}
          className="custom-select-option"
          key={option.value}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: Math.min(index * .035, .14), duration: .18 }}
          onClick={() => { onChange(option.value); setOpen(false); root.current?.querySelector<HTMLElement>('button')?.focus(); }}
        >
          <span><strong>{option.label}</strong>{option.description && <small>{option.description}</small>}</span>
          {option.value === value && <Check size={17}/>} 
        </motion.button>)}
      </motion.div>}
    </AnimatePresence>
  );

  return <div className={`custom-select ${open ? 'open' : ''}`} ref={root}>
    <button
      type="button"
      className="custom-select-trigger"
      aria-label={ariaLabel}
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={`${id}-listbox`}
      disabled={disabled}
      onClick={() => setOpen(value => !value)}
      onKeyDown={event => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          setOpen(true);
        }
      }}
    >
      <span><strong>{selected?.label}</strong>{selected?.description && <small>{selected.description}</small>}</span>
      <motion.span className="custom-select-chevron" animate={{ rotate: open ? 180 : 0 }} transition={{ duration: .24 }}><ChevronDown size={19}/></motion.span>
    </button>
    {mounted && createPortal(popover, document.body)}
  </div>;
}
