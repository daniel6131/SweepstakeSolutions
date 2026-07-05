import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://sweepstake.vercel.app';

  // Only the production deployment is indexable. Preview and development deploys
  // run the same code but must not compete for ranking or expose pre-tournament
  // state, so block all crawling there.
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dev-console', '/draft'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
