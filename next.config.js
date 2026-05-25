/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    NEXT_PUBLIC_OPENAI_API_KEY: process.env.VITE_OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.VITE_GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias = { ...config.resolve.alias };
    // Prevent canvas (used by some pdf libs) from failing on server
    if (isServer) {
      config.externals = [...(config.externals || []), 'canvas'];
    }
    // Handle pdfjs-dist ESM worker
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      '.js': ['.js', '.ts', '.tsx', '.jsx'],
    };
    return config;
  },
}
module.exports = nextConfig
