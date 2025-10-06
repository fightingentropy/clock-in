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
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!globalDb.__pool__) {
    globalDb.__pool__ = new Pool({ connectionString: process.env.DATABASE_URL });
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
