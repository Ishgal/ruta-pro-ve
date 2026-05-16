import type { NextConfig } from 'next';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require('next-pwa');

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  reactStrictMode: true,
  serverExternalPackages: ['pdf-parse'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'wfwpagaswdyemlqiqnjl.supabase.co',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  // IMPORTANTE: Esto evita conflictos en Vercel
  buildExcludes: [/middleware-manifest\.json$/],
})(nextConfig);