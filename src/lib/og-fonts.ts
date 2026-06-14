/**
 * Font loader for the share-card ImageResponse (Satori).
 *
 * Satori cannot read CSS `next/font` vars, so we hand it real font binaries.
 * The .woff files live in `public/fonts` and are fetched same-origin (works in
 * dev and in production without filesystem-tracing surprises), then cached in
 * module scope so repeated renders reuse them. Brand fonts only: never fall back
 * to Inter/Roboto/Arial.
 */

export type OgFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 500 | 600 | 700;
  style: 'normal';
};

const FONT_FILES: { name: string; weight: 400 | 500 | 600 | 700; file: string }[] = [
  { name: 'Anton', weight: 400, file: 'anton-400.woff' },
  { name: 'Space Grotesk', weight: 600, file: 'space-grotesk-600.woff' },
  { name: 'Space Grotesk', weight: 700, file: 'space-grotesk-700.woff' },
  { name: 'DM Sans', weight: 400, file: 'dm-sans-400.woff' },
  { name: 'DM Sans', weight: 500, file: 'dm-sans-500.woff' },
];

let cache: OgFont[] | null = null;

export async function loadOgFonts(origin: string): Promise<OgFont[]> {
  if (cache) return cache;
  const loaded = await Promise.all(
    FONT_FILES.map(async (f) => {
      try {
        const res = await fetch(`${origin}/fonts/${f.file}`);
        if (!res.ok) return null;
        const data = await res.arrayBuffer();
        return { name: f.name, data, weight: f.weight, style: 'normal' as const };
      } catch {
        return null;
      }
    })
  );
  cache = loaded.filter((f): f is OgFont => f !== null);
  return cache;
}
