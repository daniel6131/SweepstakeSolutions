'use client';

import { Download, Link2, Share2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { ThemeColors } from '@/types';

type Props = {
  /** Image route without the demo flag, e.g. `/api/share/Daniel` or `/api/share/standings`. */
  basePath: string;
  filename: string;
  title: string;
  label?: string;
  /** Distinct accessible name for the trigger (defaults to the visible label). */
  ariaLabel?: string;
  /** 'chip' is the filled accent button; 'ghost' is a subtle muted icon. */
  variant?: 'chip' | 'ghost';
  /** 'sm' is a compact icon-only trigger for tucking into a row corner. */
  size?: 'sm' | 'md';
  theme: ThemeColors;
};

function detectIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  // iPadOS reports a desktop "Macintosh" UA, so disambiguate with touch points.
  return /iP(hone|ad|od)/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

/** Opens a pixel-exact preview of a generated share PNG, with share / save / copy. */
export function ShareImageButton({
  basePath,
  filename,
  title,
  label = 'Share',
  ariaLabel,
  variant = 'chip',
  size = 'md',
  theme,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const demo = useMemo(
    () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('demo'),
    []
  );
  const path = demo ? `${basePath}${basePath.includes('?') ? '&' : '?'}demo` : basePath;
  const shareUrl = useMemo(
    () => (typeof window !== 'undefined' ? new URL(path, window.location.origin).toString() : path),
    [path]
  );
  const imgSrc = `${path}${path.includes('?') ? '&' : '?'}r=${reloadKey}`;

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);

  const openModal = useCallback(() => {
    setLoaded(false);
    setErrored(false);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1800);
  }, []);

  // Cached images can be `complete` before React binds onLoad; clear the skeleton.
  const imgRefCb = useCallback((el: HTMLImageElement | null) => {
    if (el?.complete && el.naturalWidth > 0) setLoaded(true);
  }, []);

  const fetchFile = useCallback(async () => {
    const res = await fetch(path);
    if (!res.ok) throw new Error('render failed');
    const blob = await res.blob();
    return new File([blob], filename, { type: 'image/png' });
  }, [path, filename]);

  const handleShare = useCallback(async () => {
    try {
      const file = await fetchFile();
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title });
        return;
      }
      if (navigator.share) {
        await navigator.share({ title, url: shareUrl });
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      flash('Link copied');
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      try {
        await navigator.clipboard.writeText(shareUrl);
        flash('Link copied');
      } catch {
        flash('Could not share');
      }
    }
  }, [fetchFile, title, shareUrl, flash]);

  const handleSave = useCallback(async () => {
    // iOS cannot write to Photos directly; route Save through the share sheet,
    // whose "Save Image" action lands in the photo album.
    if (detectIOS()) {
      try {
        const file = await fetchFile();
        const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
        if (nav.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title });
          return;
        }
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
        // fall through to a direct download
      }
    }
    // Same-origin download: the `download` attribute forces a save with our
    // filename, and avoids a blob object URL (keeps this off the DOM-XSS path).
    const a = document.createElement('a');
    a.href = path;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [fetchFile, path, filename, title]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      flash('Link copied');
    } catch {
      flash('Could not copy');
    }
  }, [shareUrl, flash]);

  const actionStyle = {
    background: 'transparent',
    color: 'var(--color-fg)',
    border: '1px solid var(--card-border)',
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openModal}
        aria-label={ariaLabel ?? label}
        className={`inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors ${
          size === 'sm' ? 'p-1.5' : 'p-2'
        } ${variant === 'ghost' ? 'hover:bg-(--color-accent-a8)' : 'hover:opacity-80'}`}
        style={
          variant === 'ghost'
            ? { color: 'var(--color-fg-muted)' }
            : {
                background: 'var(--color-accent-a8)',
                color: theme.accent,
                border: '1px solid var(--card-border)',
              }
        }>
        <Share2 size={size === 'sm' ? 13 : 15} aria-hidden />
      </button>

      <dialog
        ref={dialogRef}
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onClick={(e) => {
          if (e.target === dialogRef.current) close();
        }}
        aria-label={title}
        className="m-auto w-full max-w-md rounded-2xl border-0 p-0 backdrop:bg-black/75 backdrop:backdrop-blur-sm"
        style={{ background: 'var(--color-surface)', color: 'var(--color-fg)' }}>
        {open && (
          <div className="flex max-h-[90vh] flex-col p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-sm font-bold tracking-[1.5px] uppercase">{title}</h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="flex cursor-pointer items-center justify-center rounded-full p-1.5 transition-colors hover:opacity-70"
                style={{ color: 'var(--color-fg-muted)' }}>
                <X size={18} aria-hidden />
              </button>
            </div>

            <div
              className="relative overflow-hidden rounded-xl"
              style={{ aspectRatio: '4 / 5', background: 'var(--color-bg)' }}>
              {!loaded && !errored && (
                <div
                  className="absolute inset-0 animate-pulse"
                  style={{ background: 'var(--color-accent-a8)' }}
                />
              )}
              {errored ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                  <span className="text-[13px]" style={{ color: 'var(--color-fg-muted)' }}>
                    Could not render the card.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setErrored(false);
                      setLoaded(false);
                      setReloadKey((k) => k + 1);
                    }}
                    className="cursor-pointer rounded-lg px-3 py-1.5 text-[12px] font-semibold"
                    style={{ background: theme.accent, color: theme.bg }}>
                    Retry
                  </button>
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  ref={imgRefCb}
                  key={reloadKey}
                  src={imgSrc}
                  alt="Shareable sweepstake card preview"
                  onLoad={() => setLoaded(true)}
                  onError={() => setErrored(true)}
                  className="relative h-full w-full object-contain"
                />
              )}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleShare}
                className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-[12px] font-bold transition-opacity hover:opacity-90"
                style={{ background: theme.accent, color: theme.bg }}>
                <Share2 size={15} aria-hidden />
                Share
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-[12px] font-semibold transition-colors hover:opacity-80"
                style={actionStyle}>
                <Download size={15} aria-hidden />
                Save
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-[12px] font-semibold transition-colors hover:opacity-80"
                style={actionStyle}>
                <Link2 size={15} aria-hidden />
                Copy
              </button>
            </div>

            <div
              className="mt-2 h-4 text-center text-[11px]"
              style={{ color: 'var(--color-fg-subtle)' }}>
              {toast}
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
