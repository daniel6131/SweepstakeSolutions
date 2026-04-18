import { COUNTRY_CODES } from '@/data/countryCodes';
import type { CSSProperties } from 'react';
import { flagUrl } from '../draft-types';

export function DraftFlag({
  team,
  width,
  height,
  size = 160,
  fit = 'contain',
  className,
  style,
}: {
  team: string;
  width: number;
  height: number;
  size?: number;
  fit?: CSSProperties['objectFit'];
  className?: string;
  style?: CSSProperties;
}) {
  const code = COUNTRY_CODES[team];
  const src = flagUrl(team, size);
  const src2x = flagUrl(team, size * 2);

  if (!code) {
    return (
      <span
        className={className}
        style={{
          width,
          height,
          display: 'block',
          borderRadius: 8,
          background: 'rgba(255,255,255,0.08)',
          ...style,
        }}
      />
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      srcSet={src2x !== src ? `${src2x} 2x` : undefined}
      alt={team}
      loading="lazy"
      className={className}
      style={{
        width,
        height,
        display: 'block',
        objectFit: fit,
        ...style,
      }}
    />
  );
}
