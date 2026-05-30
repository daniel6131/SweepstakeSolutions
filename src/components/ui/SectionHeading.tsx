type SectionHeadingProps = {
  overline?: string;
  line1: string;
  line2?: string;
  accent: string;
};

export function SectionHeading({ overline, line1, line2, accent }: SectionHeadingProps) {
  return (
    <div className="mb-9 text-center md:mb-14" data-reveal>
      {overline && (
        <div className="mb-3 flex items-center justify-center gap-3 md:mb-4">
          <span className="block h-0.75 w-8 md:w-10" style={{ background: accent }} />
          <span
            className="font-heading text-[11px] font-semibold uppercase"
            style={{ color: accent, letterSpacing: '3px' }}>
            {overline}
          </span>
          <span className="block h-0.75 w-8 md:w-10" style={{ background: accent }} />
        </div>
      )}
      <h2
        className="headline-xl"
        style={{ color: 'var(--color-fg)', textWrap: 'balance', letterSpacing: '-0.01em' }}>
        {line1}
        {line2 && <span style={{ color: accent, transition: 'color 0.5s' }}> {line2}</span>}
      </h2>
    </div>
  );
}
