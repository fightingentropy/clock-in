import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createClient } from '@libsql/client';

const tursoUrl = process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL;

if (!tursoUrl) {
  console.error('Missing TURSO_DATABASE_URL or DATABASE_URL environment variable.');
  process.exit(1);
}

const client = createClient({
  url: tursoUrl,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function ensureMigrationsTable() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id" TEXT PRIMARY KEY,
      "checksum" TEXT NOT NULL,
      "finished_at" DATETIME,
      "migration_name" TEXT NOT NULL,
      "logs" TEXT,
      "rolled_back_at" DATETIME,
      "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "applied_steps_count" INTEGER NOT NULL DEFAULT 0
    );
  `);
}

async function loadAppliedMigrations() {
  const appliedResult = await client.execute(
    'SELECT "migration_name" FROM "_prisma_migrations"'
  );
  return new Set(
    appliedResult.rows
      .map((row) => row.migration_name as string | undefined)
      .filter((name): name is string => Boolean(name))
  );
}

function readMigrationFiles() {
  const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
  return fs
    .readdirSync(migrationsDir)
    .filter((entry) => {
      const fullPath = path.join(migrationsDir, entry);
      return fs.statSync(fullPath).isDirectory();
    })
    .sort((a, b) => a.localeCompare(b))
    .map((dir) => ({
      name: dir,
      file: path.join(migrationsDir, dir, 'migration.sql'),
    }));
}

function splitStatements(sql: string) {
  return sql
    .split(/;\s*(?:\n|$)/)
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);
}

async function applyMigration(name: string, sqlPath: string) {
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const statements = splitStatements(sql);

  if (statements.length === 0) {
    console.log(`Nothing to apply for migration ${name}`);
    return;
  }

  await client.batch(statements, 'write');

  const checksum = crypto.createHash('sha256').update(sql).digest('hex');
  await client.execute({
    sql: `INSERT INTO "_prisma_migrations" (
        "id",
        "checksum",
        "finished_at",
        "migration_name",
        "logs",
        "rolled_back_at",
        "started_at",
        "applied_steps_count"
      ) VALUES (?, ?, datetime('now'), ?, '', NULL, datetime('now'), ?)`
        ,
    args: [crypto.randomUUID(), checksum, name, statements.length],
  });

  console.log(`Applied migration ${name}`);
}

async function main() {
  await ensureMigrationsTable();
  const appliedMigrations = await loadAppliedMigrations();
  const migrations = readMigrationFiles();

  for (const migration of migrations) {
    if (appliedMigrations.has(migration.name)) {
      console.log(`Skipping already applied migration ${migration.name}`);
      continue;
    }

    await applyMigration(migration.name, migration.file);
  }

  console.log('Migration application finished.');
  process.exit(0);
}

main().catch((error) => {
  console.error('Failed to apply migrations', error);
  process.exit(1);
});
