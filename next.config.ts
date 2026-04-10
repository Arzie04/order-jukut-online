import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Environment variables validation
  env: {
    NEXT_PUBLIC_APPS_SCRIPT_URL: process.env.NEXT_PUBLIC_APPS_SCRIPT_URL,
    NEXT_PUBLIC_GOOGLE_FORM_URL: process.env.NEXT_PUBLIC_GOOGLE_FORM_URL,
    NEXT_PUBLIC_FORM_FIELD_NAMA: process.env.NEXT_PUBLIC_FORM_FIELD_NAMA,
    NEXT_PUBLIC_FORM_FIELD_PESANAN: process.env.NEXT_PUBLIC_FORM_FIELD_PESANAN,
    NEXT_PUBLIC_FORM_FIELD_NOTE: process.env.NEXT_PUBLIC_FORM_FIELD_NOTE,
    NEXT_PUBLIC_FORM_FIELD_TOTAL: process.env.NEXT_PUBLIC_FORM_FIELD_TOTAL,
    NEXT_PUBLIC_FORM_FIELD_NO_ORDER: process.env.NEXT_PUBLIC_FORM_FIELD_NO_ORDER,
  },
  
  // Optimize for production
  experimental: {
    optimizePackageImports: ['react', 'react-dom'],
  },
  
  // Headers for better caching and security
  async headers() {
    return [
      {
        source: '/api/proxy/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, stale-while-revalidate=300',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
