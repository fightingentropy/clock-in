import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";

export type Database = Record<string, unknown>;

type GlobalWithDb = typeof globalThis & {
  __db__?: Kysely<Database>;
  __dialect__?: PostgresDialect;
  __pool__?: Pool;
};

const globalDb = globalThis as GlobalWithDb;

const createPool = () => {
  const connectionString =
    process.env.DATABASE_URL ??
    process.env.POSTGRES_PRISMA_URL ??
    process.env.POSTGRES_URL ??
    process.env.POSTGRES_URL_NON_POOLING;

  if (!connectionString) {
    throw new Error("Database connection string is not configured");
  }

  if (!globalDb.__pool__) {
    globalDb.__pool__ = new Pool({ connectionString });
  }

  return globalDb.__pool__;
};

export const getDialect = () => {
  if (!globalDb.__dialect__) {
    globalDb.__dialect__ = new PostgresDialect({ pool: createPool() });
  }
  return globalDb.__dialect__;
};

export const getDb = () => {
  if (!globalDb.__db__) {
    globalDb.__db__ = new Kysely<Database>({
      dialect: getDialect(),
    });
  }
  return globalDb.__db__;
};
