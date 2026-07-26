import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    images: {
      remotePatterns: [{
        protocol: 'https',
        hostname: 'i.imgur.com',
        port: '',
        pathname: '/**'
      }, 
      {
        protocol: 'https',
        hostname: 'storage.ko-fi.com',
        port: '',
        pathname: '/**'
      }, 
      {
        protocol: 'https',
        hostname: 'img.goodfon.com',
        port: '',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**'
      }]
    },
    experimental: {
      serverActions: {
        bodySizeLimit: "5MB"
      }
    }
};

export default withNextIntl(nextConfig);
