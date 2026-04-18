'use client';

import { useCallback, useEffect, useRef } from 'react';

type DialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
};

export function Dialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Sync open state with native dialog API
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) {
      el.showModal();
      cancelRef.current?.focus();
    } else {
      el.close();
    }
  }, [open]);

  // Close on backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current) onClose();
    },
    [onClose]
  );

  // Trap focus within dialog
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDialogElement>) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    },
    [onClose]
  );

  const confirmColor = variant === 'danger' ? 'var(--color-danger)' : 'var(--color-accent)';

  return (
    <dialog
      ref={dialogRef}
      onKeyDown={handleKeyDown}
      onClick={handleBackdropClick}
      aria-labelledby="dialog-title"
      aria-describedby="dialog-desc"
      className="m-auto w-full max-w-sm rounded-xl border-0 p-0 shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      style={{ background: 'var(--color-surface)', color: 'var(--color-fg)' }}>
      <div className="p-6">
        <h2 id="dialog-title" className="font-heading mb-2 text-base font-semibold tracking-wide">
          {title}
        </h2>
        <p
          id="dialog-desc"
          className="text-sm leading-relaxed"
          style={{ color: 'var(--color-fg-muted)' }}>
          {description}
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            ref={cancelRef}
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            style={{
              background: 'transparent',
              color: 'var(--color-fg-muted)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}>
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80"
            style={{
              background: confirmColor,
              color: variant === 'danger' ? '#fff' : 'var(--color-bg)',
              fontWeight: 600,
            }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
