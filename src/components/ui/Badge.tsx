type BadgeVariant = 'win' | 'draw' | 'loss' | 'live' | 'played' | 'upcoming' | 'accent' | 'muted';

type BadgeProps = {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
};

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; color: string }> = {
  win: {
    bg: 'color-mix(in srgb, var(--color-success) 15%, transparent)',
    color: 'var(--color-success)',
  },
  draw: {
    bg: 'color-mix(in srgb, var(--color-warning) 15%, transparent)',
    color: 'var(--color-warning)',
  },
  loss: {
    bg: 'color-mix(in srgb, var(--color-danger) 15%, transparent)',
    color: 'var(--color-danger)',
  },
  live: {
    bg: 'color-mix(in srgb, var(--color-danger) 20%, transparent)',
    color: 'var(--color-danger)',
  },
  played: { bg: 'rgba(255,255,255,0.06)', color: 'var(--color-fg-muted)' },
  upcoming: { bg: 'var(--color-accent-a8)', color: 'var(--color-accent)' },
  accent: { bg: 'var(--color-accent-a16)', color: 'var(--color-accent)' },
  muted: { bg: 'rgba(255,255,255,0.06)', color: 'var(--color-fg-subtle)' },
};

export function Badge({ variant, children, className = '' }: BadgeProps) {
  const { bg, color } = VARIANT_STYLES[variant];
  return (
    <span
      className={`inline-flex items-center rounded-md px-1.5 py-0.5 font-heading text-[10px] font-semibold uppercase tracking-widest ${className}`}
      style={{ background: bg, color }}>
      {children}
    </span>
  );
}
