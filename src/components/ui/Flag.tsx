import { COUNTRY_CODES } from '@/data/countryCodes';

type FlagProps = {
  team: string;
  size?: number;
};

export function Flag({ team, size = 28 }: FlagProps) {
  const code = COUNTRY_CODES[team];

  if (!code) {
    return (
      <span
        className="inline-block rounded"
        style={{
          width: size,
          height: size * 0.7,
          background: '#333',
        }}
      />
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={`https://flagcdn.com/w80/${code}.png`}
      srcSet={`https://flagcdn.com/w160/${code}.png 2x`}
      alt={team}
      loading="lazy"
      className="block rounded"
      style={{
        width: size,
        height: size * 0.66,
        objectFit: 'cover',
        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    />
  );
}
