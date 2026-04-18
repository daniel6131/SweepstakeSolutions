import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://sweepstake.vercel.app';
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
