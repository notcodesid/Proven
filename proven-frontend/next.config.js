/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'pbs.twimg.com' },
      { protocol : 'https' , hostname : 'xerdtocgjurijragoydr.supabase.co'},
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      {
        protocol: 'https',
        hostname: 'xerdtocgjurijragoydr.supabase.co',
        pathname: '/storage/v1/object/public/**'
      },
    ],
  },
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'pino-pretty': false,
      'pino-abstract-transport': false,
      'sonic-boom': false,
    };
    return config;
  },
};

module.exports = nextConfig;