/** @type {import('next').NextConfig} */
const nextConfig = {
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
