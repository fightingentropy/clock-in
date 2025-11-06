import { Database } from "bun:sqlite";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
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

const createAdmin = async () => {
  loadEnv();

  const databasePath = resolveDatabasePath();
  const databaseDir = dirname(databasePath);

  if (!existsSync(databaseDir)) {
    mkdirSync(databaseDir, { recursive: true });
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@clockin.local";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";
  const fullName = process.env.ADMIN_FULL_NAME ?? "Admin User";

  console.log("📦 Using SQLite database at:", databasePath);
  console.log("🔐 Setting up admin account for:", adminEmail);

  const db = new Database(databasePath);
  db.exec("PRAGMA foreign_keys = ON;");

  try {
    const now = new Date().toISOString();
    const passwordHash = await Bun.password.hash(adminPassword);

    const existing = db
      .query<{ user_id: string }>(
        "SELECT user_id FROM user_profiles WHERE email = ? LIMIT 1",
      )
      .get(adminEmail);

    if (existing) {
      console.log("👤 Admin user already exists, updating credentials...");
      db.query(
        "UPDATE user_profiles SET password_hash = ?, role = 'admin', full_name = COALESCE(full_name, ?), updated_at = ? WHERE user_id = ?",
      ).run(passwordHash, fullName, now, existing.user_id);
      console.log("✅ Admin password refreshed and role enforced.");
    } else {
      console.log("➕ Creating new admin profile...");
      const userId = randomUUID();
      db.query(
        "INSERT INTO user_profiles (user_id, email, password_hash, full_name, role, metadata, created_at, updated_at) VALUES (?, ?, ?, ?, 'admin', '{}', ?, ?)",
      ).run(userId, adminEmail, passwordHash, fullName, now, now);
      console.log("✅ Admin profile created successfully.");
    }

    console.log("");
    console.log("🎉 Admin user setup complete!");
    console.log("Login credentials:");
    console.log("  Email:", adminEmail);
    console.log("  Password:", adminPassword);
    console.log("");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("❌ Error setting up admin:", message);
    console.error(error);
    process.exit(1);
  } finally {
    db.close();
  }
};

createAdmin();

