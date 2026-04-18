import Image from 'next/image';

import { COUNTRY_CODES } from '@/data/countryCodes';

type FlagProps = {
  team: string;
  size?: number;
};

export function Flag({ team, size = 28 }: FlagProps) {
  const code = COUNTRY_CODES[team];
  const height = Math.round(size * 0.66);

  if (!code) {
    return (
      <span
        className="inline-block rounded"
        style={{ width: size, height, background: 'var(--color-fg-subtle)' }}
        aria-hidden="true"
      />
    );
  }

  return (
    <Image
      src={`https://flagcdn.com/w80/${code}.png`}
      width={size}
      height={height}
      alt={`${team} flag`}
      className="block rounded"
      style={{
        objectFit: 'cover',
        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    />
  );
}
