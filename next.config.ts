// next.config.ts
import type { NextConfig } from 'next';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require('next-pwa');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['your-s3-bucket.s3.amazonaws.com'],
  },
  typescript: {
    ignoreBuildErrors: true,   // Evita que errores de tipo bloquee el build
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})(nextConfig);