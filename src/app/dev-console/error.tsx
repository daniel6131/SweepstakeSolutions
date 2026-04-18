'use client';

import { useEffect } from 'react';

export default function DevConsoleError({
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
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#08111b] px-4 text-center text-white">
      <h1 className="font-display mb-4 text-[clamp(32px,6vw,64px)] uppercase leading-none tracking-tight text-[#7ef2cf]">
        Console error
      </h1>
      <p className="mb-8 max-w-md text-sm leading-6 text-white/60">
        An unexpected error occurred in the dev console.
      </p>
      <button
        onClick={reset}
        className="font-heading cursor-pointer rounded-full bg-[#7ef2cf] px-6 py-3 text-[11px] font-bold uppercase tracking-[2px] text-[#08111b]">
        Try again
      </button>
    </main>
  );
}
