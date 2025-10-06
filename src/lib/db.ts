import { readFileSync } from "node:fs";

import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import type { PoolConfig } from "pg";

export type Database = Record<string, unknown>;

type GlobalWithDb = typeof globalThis & {
  __db__?: Kysely<Database>;
  __dialect__?: PostgresDialect;
  __pool__?: Pool;
};

const globalDb = globalThis as GlobalWithDb;

const parseBoolean = (value?: string) => {
  if (value === undefined) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "" || normalized === "auto") {
    return undefined;
  }

  if (["1", "true", "yes"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no"].includes(normalized)) {
    return false;
  }

  return undefined;
};

const getSslConfig = (): PoolConfig["ssl"] | undefined => {
  const sslMode = process.env.DATABASE_SSL_MODE?.toLowerCase();
  const rejectUnauthorized = parseBoolean(
    process.env.DATABASE_SSL_REJECT_UNAUTHORIZED,
  );
  const caPath = process.env.DATABASE_SSL_CA_PATH;
  const caInline = process.env.DATABASE_SSL_CA;

  if (
    sslMode === undefined &&
    rejectUnauthorized === undefined &&
    caPath === undefined &&
    caInline === undefined
  ) {
    return undefined;
  }

  if (sslMode === "disable") {
    return false;
  }

  const sslOptions: Record<string, unknown> = {};

  const shouldSkipVerification =
    sslMode === "noverify" || sslMode === "no-verify";

  const rejectUnauthorizedValue =
    rejectUnauthorized !== undefined
      ? rejectUnauthorized
      : shouldSkipVerification
        ? false
        : undefined;

  if (rejectUnauthorizedValue !== undefined) {
    sslOptions.rejectUnauthorized = rejectUnauthorizedValue;
  }

  let ca: string | undefined;

  if (caPath) {
    try {
      ca = readFileSync(caPath, "utf8");
    } catch (error) {
      throw new Error(
        `Failed to read certificate authority file at ${caPath}: ${String(error)}`,
      );
    }
  } else if (caInline) {
    ca = caInline.replace(/\\n/g, "\n");
  }

  if (ca) {
    sslOptions.ca = ca;
  }

  if (Object.keys(sslOptions).length === 0) {
    return true;
  }

  return sslOptions;
};

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
    const ssl = getSslConfig();
    const poolConfig: PoolConfig = ssl === undefined
      ? { connectionString }
      : { connectionString, ssl };

    globalDb.__pool__ = new Pool(poolConfig);
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
