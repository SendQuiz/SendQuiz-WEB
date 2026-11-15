import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      { source: '/auth/:path*', destination: '/api/auth/:path*' },
      { source: '/quiz/:path*', destination: '/api/quiz/:path*' },
      { source: '/feedback', destination: '/api/feedback' },
      { source: '/profile/:path*', destination: '/api/profile/:path*' },
    ];
  },
};

export default nextConfig;
