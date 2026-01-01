
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
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
  // Adiciona um proxy para redirecionar as chamadas de API no ambiente de desenvolvimento
  async rewrites() {
    return [
      {
        source: '/api/processPayment',
        destination: 'http://127.0.0.1:5001/pisa-vibe-db/southamerica-east1/processPayment',
      },
       {
        source: '/api/processCardPayment',
        destination: 'http://127.0.0.1:5001/pisa-vibe-db/southamerica-east1/processCardPayment',
      },
    ]
  },
};

export default nextConfig;
