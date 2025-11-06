import { Database } from "bun:sqlite";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";

let instance: Database | null = null;

const resolveDatabasePath = () => {
  const configured = process.env.DATABASE_PATH?.trim();
  if (configured && configured.length > 0) {
    return isAbsolute(configured) ? configured : join(process.cwd(), configured);
  }
  return join(process.cwd(), "sqlite", "clock-in.sqlite");
};

const openDatabase = () => {
  const databasePath = resolveDatabasePath();
  const directory = dirname(databasePath);

  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }

  const db = new Database(databasePath, {
    create: true,
    readonly: false,
  });

  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA busy_timeout = 5000;");

  return db;
};

export const getDb = () => {
  if (!instance) {
    instance = openDatabase();
  }
  return instance;
};

export const resetDbInstance = () => {
  if (instance) {
    instance.close();
    instance = null;
  }
};

export const nowIso = () => new Date().toISOString();

