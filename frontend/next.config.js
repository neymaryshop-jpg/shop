/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,

  // Отключаем воркеры для стабильности в Docker
  experimental: {
    workerThreads: false,
    cpus: 1,
  },

  // Отключаем статическую генерацию для страниц ошибок
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 2,
  },

  images: {
    formats: ['image/webp'],
    minimumCacheTTL: 86400,
  },

  compress: true,

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        http: false,
        https: false,
      };
    }
    return config;
  },

  async rewrites() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
    return [
      {
        source: '/api/:path*',
        destination: `${API_URL}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
