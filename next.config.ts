
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
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
   webpack: (config, { isServer }) => {
    // Adiciona a regra para arquivos .p12
    config.module.rules.push({
      test: /\.p12$/,
      use: [
        {
          loader: 'raw-loader',
        },
      ],
    });

    return config;
  },
};

export default nextConfig;
