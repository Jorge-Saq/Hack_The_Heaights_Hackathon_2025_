/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'crowd-catcher-stack-user-profiles-dev.s3.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'crowd-catcher-stack-event-photos-dev.s3.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      // You can keep 'localhost' if you serve images locally during development
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
};

module.exports = nextConfig;