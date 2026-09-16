/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },
  images: {
    domains: ['images.unsplash.com', 'kinetixfit.s3.amazonaws.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'kinetixfit.s3.amazonaws.com',
      },
    ],
    unoptimized: false,
  },
  transpilePackages: ['@kinetix/shared'],
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
};

export default nextConfig;
