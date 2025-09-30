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
  webpack(config, { isServer }) {
    config.module.rules.push({
      test: /\.md$/i,
      type: 'asset/source',
    });

    config.module.rules.push({
      test: /LICENSE$/i,
      type: 'asset/source',
    });

    if (isServer) {
      const externals = config.externals ?? [];

      config.externals = Array.isArray(externals)
        ? [...externals, '@libsql/client', '@prisma/adapter-libsql']
        : [externals, '@libsql/client', '@prisma/adapter-libsql'].filter(Boolean);
    }

    return config;
  },
};

export default nextConfig;
