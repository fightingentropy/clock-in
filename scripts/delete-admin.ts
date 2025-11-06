import { Database } from "bun:sqlite";
import { existsSync, readFileSync } from "node:fs";
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

const deleteAdmin = () => {
  loadEnv();

  const databasePath = resolveDatabasePath();
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@clockin.local";

  console.log("📦 Using SQLite database at:", databasePath);
  console.log("🗑️  Attempting to delete admin:", adminEmail);

  const db = new Database(databasePath);
  db.exec("PRAGMA foreign_keys = ON;");

  try {
    const existing = db
      .query<{ user_id: string }>(
        "SELECT user_id FROM user_profiles WHERE email = ? LIMIT 1",
      )
      .get(adminEmail);

    if (!existing) {
      console.log("⚠️  Admin user not found, nothing to delete.");
      return;
    }

    db.query("DELETE FROM user_profiles WHERE user_id = ?").run(existing.user_id);
    console.log("✅ Admin user and related data deleted successfully.");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("❌ Error deleting admin:", message);
    console.error(error);
    process.exit(1);
  } finally {
    db.close();
  }
};

deleteAdmin();

