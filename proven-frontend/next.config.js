const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseHostname = null;

if (SUPABASE_URL) {
  try {
    supabaseHostname = new URL(SUPABASE_URL).hostname;
  } catch (err) {
    console.warn(`Invalid NEXT_PUBLIC_SUPABASE_URL provided: ${SUPABASE_URL}`);
  }
} else {
  console.warn('NEXT_PUBLIC_SUPABASE_URL is not set; Supabase image domains will be omitted.');
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'pbs.twimg.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      ...(supabaseHostname
        ? [
            { protocol: 'https', hostname: supabaseHostname },
            {
              protocol: 'https',
              hostname: supabaseHostname,
              pathname: '/storage/v1/object/public/**',
            },
          ]
        : []),
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
