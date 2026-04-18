'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1
        className="font-display mb-4 text-[clamp(40px,8vw,80px)] uppercase leading-none tracking-tight"
        style={{ color: 'var(--theme-accent)' }}>
        Something went wrong
      </h1>
      <p className="mb-8 max-w-md text-sm leading-6" style={{ color: 'rgba(251,251,251,0.6)' }}>
        An unexpected error occurred. You can try again or return to the sweepstake home.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="font-heading cursor-pointer rounded-full px-6 py-3 text-[11px] font-bold uppercase tracking-[2px]"
          style={{ background: 'var(--theme-accent)', color: 'var(--theme-bg)' }}>
          Try again
        </button>
        <Link
          href="/"
          className="font-heading rounded-full border px-6 py-3 text-[11px] font-bold uppercase tracking-[2px]"
          style={{ borderColor: 'var(--theme-accent)', color: 'var(--theme-accent)' }}>
          Go home
        </Link>
      </div>
    </main>
  );
}
