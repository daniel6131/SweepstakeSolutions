'use client';

import { useEffect } from 'react';

export default function DraftError({
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
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#030d10] px-4 text-center text-white">
      <h1 className="font-display mb-4 text-[clamp(32px,6vw,64px)] uppercase leading-none tracking-tight text-[#94ffe4]">
        Draft error
      </h1>
      <p className="mb-8 max-w-md text-sm leading-6 text-white/60">
        Something went wrong with the draft ceremony. Your progress has been saved.
      </p>
      <button
        onClick={reset}
        className="font-heading cursor-pointer rounded-full bg-[#94ffe4] px-6 py-3 text-[11px] font-bold uppercase tracking-[2px] text-[#030d10]">
        Try again
      </button>
    </main>
  );
}
