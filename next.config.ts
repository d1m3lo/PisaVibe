
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    // Only in development, rewrite API calls to the Firebase Emulator
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination:
            'http://127.0.0.1:5001/studio-4155277971-b1669/southamerica-east1/:path*',
        },
      ];
    }
    // In production, App Hosting automatically forwards /api to your Cloud Run service
    return [];
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      }
    ],
  },
};

export default nextConfig;
