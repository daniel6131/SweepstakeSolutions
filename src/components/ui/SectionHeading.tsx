type SectionHeadingProps = {
  overline?: string;
  line1: string;
  line2?: string;
  accent: string;
};

export function SectionHeading({ overline, line1, line2, accent }: SectionHeadingProps) {
  return (
    <div className="mb-8 text-center md:mb-12" data-reveal>
      {overline && (
        <div className="overline mb-3 md:mb-4" style={{ color: `${accent}44` }}>
          {overline}
        </div>
      )}
      <h2 className="headline-xl" style={{ color: accent, transition: 'color 0.5s' }}>
        {line1}
      </h2>
      {line2 && (
        <div
          className="headline-s mt-1 md:mt-2"
          style={{ color: `${accent}28`, letterSpacing: '0.12em', transition: 'color 0.5s' }}>
          {line2}
        </div>
      )}
    </div>
  );
}
