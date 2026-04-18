type StatTileProps = {
  label: string;
  value: string | number;
  delta?: string;
  accent?: string;
  className?: string;
};

export function StatTile({ label, value, delta, accent, className = '' }: StatTileProps) {
  return (
    <div
      className={`rounded-2xl px-3 py-3 ${className}`}
      style={{
        background: 'color-mix(in srgb, var(--color-bg) 80%, transparent)',
        border: '1px solid var(--color-accent-a12)',
      }}>
      <div
        className="font-heading text-[8px] font-bold uppercase tracking-[2px]"
        style={{ color: accent ?? 'var(--color-accent-a64)' }}>
        {label}
      </div>
      <div
        className="font-display mt-1 text-[18px] leading-none"
        style={{ color: accent ?? 'var(--color-accent)' }}>
        {value}
      </div>
      {delta && (
        <div className="mt-0.5 text-[9px]" style={{ color: 'var(--color-fg-subtle)' }}>
          {delta}
        </div>
      )}
    </div>
  );
}
