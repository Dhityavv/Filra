/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/arcade/:path*',
        destination: '/minigames/:path*',
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'image.tmdb.org', pathname: '/t/p/**' },
    ],
  },
  outputFileTracingIncludes: {
    '/': ['./index.html'],
  },
};

module.exports = nextConfig;
