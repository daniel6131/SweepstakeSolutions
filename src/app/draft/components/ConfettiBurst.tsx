import { C, mulberry32 } from '../draft-types';

export function ConfettiBurst({
  active,
  seed,
  hue = 160,
}: {
  active: boolean;
  seed: number;
  hue?: number;
}) {
  if (!active) return null;
  const rand = mulberry32(seed);
  const palette = [
    `hsl(${hue} 100% 68%)`,
    `hsl(${(hue + 90) % 360} 100% 68%)`,
    `hsl(${(hue + 180) % 360} 100% 68%)`,
    `hsl(${(hue + 270) % 360} 100% 68%)`,
    '#fff',
    C.gold,
    C.accent,
    '#FF6EC7',
  ];

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      {Array.from({ length: 60 }, (_, i) => {
        const angle = rand() * 360;
        const dist = 120 + rand() * 400;
        const px = Math.cos((angle * Math.PI) / 180) * dist;
        const py = Math.sin((angle * Math.PI) / 180) * dist - 100;
        const size = 4 + rand() * 12;
        const color = palette[Math.floor(rand() * palette.length)];
        const isRect = rand() > 0.5;
        const sx = (rand() - 0.5) * 24;
        const sy = (rand() - 0.5) * 24;
        return (
          <div
            key={i}
            className="absolute left-1/2 top-1/2"
            style={{
              width: isRect ? size * 2.5 : size,
              height: size,
              background: color,
              borderRadius: isRect ? '2px' : '50%',
              marginLeft: -size / 2,
              marginTop: -size / 2,
              opacity: 0,
              animation: `confetti-burst ${0.6 + rand() * 0.8}s cubic-bezier(0.22, 0.61, 0.36, 1) forwards`,
              animationDelay: `${i * 0.01}s`,
              ['--sx' as string]: `${sx}px`,
              ['--sy' as string]: `${sy}px`,
              ['--cx' as string]: `${px}px`,
              ['--cy' as string]: `${py}px`,
              ['--rot' as string]: `${rand() * 720 - 360}deg`,
            }}
          />
        );
      })}
    </div>
  );
}
