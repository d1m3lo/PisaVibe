
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
  env: {
    NEXT_PUBLIC_EFI_CLIENT_ID_SANDBOX: process.env.EFI_CLIENT_ID_SANDBOX,
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
    // Adicionado para permitir imagens da Efí em formato base64
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
