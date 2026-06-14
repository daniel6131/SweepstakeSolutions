import { Anton, DM_Sans, Space_Grotesk } from 'next/font/google';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? 'https://sweepstake.vercel.app'),
  title: {
    default: 'World Cup Sweepstake 2026',
    template: '%s | WC Sweepstake 2026',
  },
  description:
    'Track your sweepstake standings for the 2026 FIFA World Cup across the USA, Mexico & Canada.',
  openGraph: {
    type: 'website',
    title: 'World Cup Sweepstake 2026',
    description:
      'Track your sweepstake standings for the 2026 FIFA World Cup across the USA, Mexico & Canada.',
    siteName: 'WC Sweepstake 2026',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'World Cup Sweepstake 2026',
    description:
      'Track your sweepstake standings for the 2026 FIFA World Cup across the USA, Mexico & Canada.',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#002629',
};

const displayFont = Anton({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display',
});

const headingFont = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-heading',
});

const bodyFont = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${headingFont.variable} ${bodyFont.variable}`}>
      <head>
        <meta name="format-detection" content="telephone=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#002629" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
