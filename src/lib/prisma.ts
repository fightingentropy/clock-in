import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const tursoUrl = process.env.TURSO_DATABASE_URL;

if (!tursoUrl) {
  throw new Error('Turso database URL is not configured. Set TURSO_DATABASE_URL.');
}

if (!process.env.TURSO_AUTH_TOKEN) {
  throw new Error('Turso auth token is not configured. Set TURSO_AUTH_TOKEN.');
}

const prismaClient = globalForPrisma.prisma ?? new PrismaClient({
  adapter: new PrismaLibSQL({
    url: tursoUrl,
    authToken: process.env.TURSO_AUTH_TOKEN,
  }),
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prismaClient;
}

export const prisma = prismaClient;
