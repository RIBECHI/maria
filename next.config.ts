
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    allowedDevOrigins: [
      '6000-firebase-studio-1749160166624.cluster-qhrn7lb3szcfcud6uanedbkjnm.cloudworkstations.dev',
    ],
  },
  reactStrictMode: false,
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
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    const bucket = `${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}`;
    return [
      // Proxy para downloads
      {
        source: '/v0/b/:bucket/o/:path*',
        destination: `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/:path*`,
      },
       // Proxy para uploads (Corrigido para usar o endpoint de upload correto)
      {
        source: '/api/storage-proxy',
        destination: `https://firebasestorage.googleapis.com/v1/b/${bucket}/o`,
      },
    ];
  },
};

export default nextConfig;
