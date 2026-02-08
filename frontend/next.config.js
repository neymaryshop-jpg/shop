/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,

  images: {
    formats: ['image/webp'],
    minimumCacheTTL: 86400,
  },

  compress: true,

  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        'three': 'three',
        '@react-three/fiber': '@react-three/fiber',
        '@react-three/drei': '@react-three/drei',
      });
    }
    
    // Fix API proxy in production
    config.resolve.fallback = {
      'http': 'https://node-http',
      'https': 'https://node-https',
    };
    
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
  }
};

module.exports = nextConfig;
