import type { Metadata } from 'next';
import { authenticateDraft } from '@/app/draft/actions';

export const metadata: Metadata = {
  title: 'Draft Access',
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ error?: string }> };

export default async function DraftLoginPage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#030d10] px-4">
      <div
        className="w-full max-w-md rounded-[28px] p-7"
        style={{
          background:
            'radial-gradient(circle at top right, rgba(148,255,228,0.12) 0%, transparent 30%), linear-gradient(180deg, #071418 0%, #0a1e24 100%)',
          border: '1px solid rgba(148,255,228,0.14)',
          boxShadow: '0 28px 80px rgba(3,13,16,0.6)',
        }}>
        <p
          className="font-heading mb-2 text-[10px] font-bold uppercase tracking-[3px]"
          style={{ color: 'rgba(148,255,228,0.5)' }}>
          Draft ceremony
        </p>
        <h1
          className="font-display mb-4 text-[36px] leading-none tracking-[-0.03em] md:text-[48px]"
          style={{ color: '#94ffe4' }}>
          Access required
        </h1>
        <p className="mb-6 text-sm leading-6" style={{ color: 'rgba(251,251,251,0.6)' }}>
          Enter the draft password to access the ceremony.
        </p>

        <form action={authenticateDraft} className="space-y-4">
          <label className="block">
            <span
              className="font-heading mb-2 block text-[10px] font-bold uppercase tracking-[3px]"
              style={{ color: 'rgba(148,255,228,0.5)' }}>
              Password
            </span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-2xl border px-4 py-3 outline-none transition-colors"
              style={{
                background: 'rgba(3,13,16,0.8)',
                borderColor: 'rgba(148,255,228,0.18)',
                color: '#94ffe4',
              }}
            />
          </label>

          {params.error ? (
            <p role="alert" className="text-sm font-medium text-[#ff8e8e]">
              Incorrect password. Please try again.
            </p>
          ) : null}

          <button
            type="submit"
            className="font-heading w-full cursor-pointer rounded-2xl px-4 py-3 text-[11px] font-bold uppercase tracking-[2px] transition-opacity hover:opacity-90"
            style={{ background: '#94ffe4', color: '#030d10' }}>
            Enter draft
          </button>
        </form>
      </div>
    </main>
  );
}
