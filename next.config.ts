
import type {NextConfig} from 'next';
import path from 'path';

const nextConfig: NextConfig = {
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
    // Redirect Firebase SDK imports to our Supabase compatibility shims
    config.resolve.alias = {
      ...config.resolve.alias,
      'firebase/firestore': path.resolve(__dirname, 'src/firebase/compat-firestore.ts'),
      'firebase/auth': path.resolve(__dirname, 'src/firebase/compat-auth.ts'),
      'firebase/messaging': path.resolve(__dirname, 'src/firebase/compat-auth.ts'), // messaging stubs are in compat-auth
      'firebase/app': path.resolve(__dirname, 'src/firebase/compat-auth.ts'),
    };

    // Adiciona a regra para arquivos .p12 (certificados MercadoPago)
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
