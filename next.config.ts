import type { NextConfig } from 'next';

const env: Record<string, string> = {};

if (process.env.NEXTAUTH_URL) {
  env.NEXTAUTH_URL = process.env.NEXTAUTH_URL;
} else if (process.env.NODE_ENV === 'development') {
  env.NEXTAUTH_URL = 'http://localhost:3000';
  process.env.NEXTAUTH_URL = env.NEXTAUTH_URL;
}

const nextConfig: NextConfig = {
  env,
};

export default nextConfig;
