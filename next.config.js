/** @type {import('next').NextConfig} */
const supabaseEnv = {};
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ANON_KEY;

if (supabaseUrl) supabaseEnv.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl;
if (supabaseAnonKey) supabaseEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY = supabaseAnonKey;

const nextConfig = {
  reactStrictMode: true,
  env: supabaseEnv,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '11mb',
    },
  },
};

module.exports = nextConfig;
