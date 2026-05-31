import type { NextConfig } from 'next';
import bundleAnalyzer from '@next/bundle-analyzer';
import { networkInterfaces } from 'node:os';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/**
 * Every non-internal IPv4 address of this machine, so opening the dev server
 * from a phone/other device on the LAN (the Network URL) is always allowed —
 * no need to hardcode an IP that DHCP can change.
 */
function lanOrigins(): string[] {
  const ips = new Set<string>();
  for (const addrs of Object.values(networkInterfaces())) {
    for (const addr of addrs ?? []) {
      if (addr.family === 'IPv4' && !addr.internal) ips.add(addr.address);
    }
  }
  return [...ips];
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Allow dev access (incl. HMR websocket) from this machine's current LAN IPs,
  // so the dev server works when opened from a phone via the Network URL.
  allowedDevOrigins: lanOrigins(),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default withBundleAnalyzer(nextConfig);
