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
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: new URL("../..", import.meta.url).pathname,
  },
};

export default nextConfig;
