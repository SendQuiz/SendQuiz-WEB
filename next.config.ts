import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: ['127.0.0.1', '192.168.1.131', '192.168.8.237', 'dev.sendquiz.net'],
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
