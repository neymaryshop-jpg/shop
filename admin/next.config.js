/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  
  // Отключаем воркеры для стабильности в Docker
  experimental: {
    workerThreads: false,
    cpus: 1,
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3002/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;