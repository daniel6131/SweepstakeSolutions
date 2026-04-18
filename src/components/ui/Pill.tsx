'use client';

import type { ReactNode } from 'react';

type PillProps = {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  role?: 'tab' | 'button';
  'aria-selected'?: boolean;
  'aria-pressed'?: boolean;
  className?: string;
};

export function Pill({
  active = false,
  onClick,
  children,
  role = 'button',
  'aria-selected': ariaSelected,
  'aria-pressed': ariaPressed,
  className = '',
}: PillProps) {
  return (
    <button
      role={role}
      aria-selected={role === 'tab' ? (ariaSelected ?? active) : undefined}
      aria-pressed={role === 'button' ? (ariaPressed ?? active) : undefined}
      onClick={onClick}
      className={`font-heading inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest transition-all ${className}`}
      style={
        active
          ? {
              background: 'var(--color-accent-a16)',
              color: 'var(--color-accent)',
              outline: '1px solid var(--color-accent-a32)',
            }
          : {
              background: 'transparent',
              color: 'var(--color-fg-muted)',
              outline: '1px solid rgba(255,255,255,0.08)',
            }
      }>
      {children}
    </button>
  );
}
