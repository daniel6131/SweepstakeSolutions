import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'World Cup Sweepstake 2026',
    short_name: 'WC Sweepstake',
    description: 'Track your sweepstake standings for the 2026 FIFA World Cup.',
    start_url: '/',
    display: 'standalone',
    background_color: '#002629',
    theme_color: '#002629',
    icons: [
      {
        src: '/favicon.ico',
        sizes: '48x48',
        type: 'image/x-icon',
      },
    ],
  };
}
