/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  port: 3003,
  assetPrefix: process.env.NODE_ENV === 'production' ? 'https://adm.neymaryshop.ton' : undefined,
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