import { Database } from "bun:sqlite";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const loadEnv = () => {
  const envPath = join(__dirname, "..", ".env.local");

  if (!existsSync(envPath)) {
    console.warn("⚠️  Warning: .env.local file not found, using default environment values");
    return;
  }

  const envContent = readFileSync(envPath, "utf8");
  const lines = envContent.split("\n");

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const match = line.match(/^([^=]+)=(.*)$/);

    if (!match) {
      continue;
    }

    const key = match[1].trim();
    let value = match[2].trim();

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
};

const resolveDatabasePath = () => {
  const configuredPath = process.env.DATABASE_PATH?.trim();
  if (configuredPath && configuredPath.length > 0) {
    return isAbsolute(configuredPath)
      ? configuredPath
      : join(process.cwd(), configuredPath);
  }
  return join(__dirname, "..", "sqlite", "clock-in.sqlite");
};

const runSchema = () => {
  loadEnv();

  const schemaPath = join(__dirname, "..", "sqlite", "schema.sql");
  if (!existsSync(schemaPath)) {
    console.error("❌ Error: Schema file not found at", schemaPath);
    process.exit(1);
  }

  const databasePath = resolveDatabasePath();
  const databaseDir = dirname(databasePath);

  if (!existsSync(databaseDir)) {
    mkdirSync(databaseDir, { recursive: true });
  }

  console.log("📦 Using SQLite database at:", databasePath);
  console.log("📖 Reading schema file from:", schemaPath);

  const schema = readFileSync(schemaPath, "utf8");
  const statements = schema
    .split(/;\s*(?:\n|$)/)
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);

  const db = new Database(databasePath);

  try {
    db.exec("PRAGMA foreign_keys = ON;");

    const applySchema = db.transaction(() => {
      for (const statement of statements) {
        db.exec(`${statement};`);
      }
    });

    applySchema();

    console.log(`✅ Applied ${statements.length} statements successfully.`);
    console.log("🎉 SQLite database is ready to use!");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("❌ Error executing schema:", message);
    console.error(error);
    process.exit(1);
  } finally {
    db.close();
  }
};

runSchema();

