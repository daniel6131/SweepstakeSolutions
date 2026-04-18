import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p
        className="font-heading mb-3 text-[11px] font-bold uppercase tracking-[3px]"
        style={{ color: 'rgba(148,255,228,0.5)' }}>
        404
      </p>
      <h1
        className="font-display mb-4 text-[clamp(40px,8vw,80px)] uppercase leading-none tracking-tight"
        style={{ color: 'var(--theme-accent)' }}>
        Page not found
      </h1>
      <p className="mb-8 max-w-md text-sm leading-6" style={{ color: 'rgba(251,251,251,0.6)' }}>
        This page doesn&apos;t exist. Head back to the sweepstake to track your teams.
      </p>
      <Link
        href="/"
        className="font-heading rounded-full px-6 py-3 text-[11px] font-bold uppercase tracking-[2px]"
        style={{ background: 'var(--theme-accent)', color: 'var(--theme-bg)' }}>
        Back to sweepstake
      </Link>
    </main>
  );
}
