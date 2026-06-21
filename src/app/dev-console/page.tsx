import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { DevConsoleClient } from '@/app/dev-console/DevConsoleClient';
import { authenticateDevConsole, logoutDevConsole } from '@/app/dev-console/actions';
import {
  DEV_CONSOLE_COOKIE,
  isDevConsoleEnabled,
  isValidDevConsoleCookie,
} from '@/lib/dev-console';
import { loadSweepstakeData } from '@/lib/load-data';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Dev Console | World Cup Sweepstake 2026',
  robots: {
    index: false,
    follow: false,
  },
};

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function DevConsolePage({ searchParams }: PageProps) {
  if (!isDevConsoleEnabled()) {
    notFound();
  }

  const params = await searchParams;
  const cookieStore = await cookies();
  // open locally with no password, closed in prod, so an enabled console with no
  // password set stays locked rather than wide open.
  const isAuthorized = isValidDevConsoleCookie(cookieStore.get(DEV_CONSOLE_COOKIE)?.value);

  if (!isAuthorized) {
    return (
      <main className="min-h-screen bg-[#08111b] px-4 py-10 text-white md:px-6">
        <div className="mx-auto max-w-xl">
          <div
            className="rounded-[32px] p-6 md:p-8"
            style={{
              background:
                'radial-gradient(circle at top right, rgba(126,242,207,0.16) 0%, transparent 30%), linear-gradient(180deg, #0f1b28 0%, #122132 100%)',
              border: '1px solid rgba(126,242,207,0.14)',
              boxShadow: '0 28px 90px rgba(8,17,27,0.55)',
            }}>
            <div
              className="font-heading mb-2 text-[10px] font-bold uppercase tracking-[3px]"
              style={{ color: 'rgba(126,242,207,0.7)' }}>
              Protected Tooling
            </div>
            <h1
              className="font-display text-[34px] leading-none tracking-[-0.05em] md:text-[48px]"
              style={{ color: '#7ef2cf' }}>
              Dev Console Lock
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-white/75 md:text-[15px]">
              This route is protected. Enter the console password from `DEV_CONSOLE_PASSWORD` to
              access the simulation tools.
            </p>

            <form action={authenticateDevConsole} className="mt-6 space-y-4">
              <label className="block">
                <span
                  className="font-heading mb-2 block text-[10px] font-bold uppercase tracking-[3px]"
                  style={{ color: 'rgba(126,242,207,0.55)' }}>
                  Password
                </span>
                <input
                  name="password"
                  type="password"
                  required
                  className="w-full rounded-2xl border px-4 py-3 outline-none"
                  style={{
                    background: 'rgba(8,17,27,0.85)',
                    borderColor: 'rgba(126,242,207,0.18)',
                    color: '#7ef2cf',
                  }}
                />
              </label>

              {params.error ? (
                <p className="text-sm font-medium text-[#ff8e8e]">
                  Password rejected. Check the configured console password and try again.
                </p>
              ) : null}

              <button
                type="submit"
                className="font-heading cursor-pointer rounded-2xl px-4 py-3 text-[11px] font-bold uppercase tracking-[2px]"
                style={{
                  background: '#7ef2cf',
                  color: '#08111b',
                }}>
                Unlock dev console
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  const data = await loadSweepstakeData();

  return (
    <>
      <div className="fixed top-4 right-4 z-50">
        <form action={logoutDevConsole}>
          <button
            type="submit"
            className="font-heading cursor-pointer rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-[2px]"
            style={{
              background: 'rgba(8,17,27,0.92)',
              borderColor: 'rgba(126,242,207,0.18)',
              color: '#7ef2cf',
            }}>
            Lock console
          </button>
        </form>
      </div>
      <DevConsoleClient
        initialFixtures={data.fixtures}
        participants={data.participants}
        sourceLabel={data.dataSource}
      />
    </>
  );
}
