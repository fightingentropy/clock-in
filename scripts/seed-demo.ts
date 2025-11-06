import { Database } from "bun:sqlite";
import { existsSync, readFileSync } from "node:fs";
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

const isoNow = () => new Date().toISOString();

const seedDemo = async () => {
  loadEnv();

  const databasePath = resolveDatabasePath();
  console.log("📦 Using SQLite database at:", databasePath);

  const db = new Database(databasePath);
  db.exec("PRAGMA foreign_keys = ON;");

  try {
    console.log("🌱 Starting demo seed...");

    const workplaces = [
      {
        name: "Main Warehouse",
        description: "Primary fulfillment center",
        latitude: 40.712776,
        longitude: -74.005974,
        radius_m: 100,
      },
      {
        name: "Downtown Office",
        description: "Client-facing HQ",
        latitude: 40.758896,
        longitude: -73.98513,
        radius_m: 75,
      },
    ];

    const workplaceIds: Record<string, string> = {};
    const now = isoNow();

    for (const workplace of workplaces) {
      const existing = db
        .query<{ id: string }>(
          "SELECT id FROM workplaces WHERE name = ? LIMIT 1",
        )
        .get(workplace.name);

      if (existing) {
        workplaceIds[workplace.name] = existing.id;
        db.query(
          "UPDATE workplaces SET description = ?, latitude = ?, longitude = ?, radius_m = ?, updated_at = ? WHERE id = ?",
        ).run(
          workplace.description,
          workplace.latitude,
          workplace.longitude,
          workplace.radius_m,
          now,
          existing.id,
        );
        console.log(`🏢 Workplace updated: ${workplace.name}`);
      } else {
        const id = randomUUID();
        db.query(
          "INSERT INTO workplaces (id, name, description, latitude, longitude, radius_m, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        ).run(
          id,
          workplace.name,
          workplace.description,
          workplace.latitude,
          workplace.longitude,
          workplace.radius_m,
          now,
          now,
        );
        workplaceIds[workplace.name] = id;
        console.log(`✅ Workplace created: ${workplace.name}`);
      }
    }

    const workerEmail = "jane.worker@example.com";
    const workerPassword = "worker123";
    const workerName = "Jane Worker";
    const workerPhone = "+1 (917) 555-9301";

    const existingWorker = db
      .query<{ user_id: string }>(
        "SELECT user_id FROM user_profiles WHERE email = ? LIMIT 1",
      )
      .get(workerEmail);

    const workerPasswordHash = await Bun.password.hash(workerPassword);
    const workerId = existingWorker?.user_id ?? randomUUID();

    if (existingWorker) {
      db.query(
        "UPDATE user_profiles SET password_hash = ?, full_name = ?, role = 'worker', phone = ?, updated_at = ? WHERE user_id = ?",
      ).run(workerPasswordHash, workerName, workerPhone, now, workerId);
      console.log("👷 Worker profile refreshed.");
    } else {
      db.query(
        "INSERT INTO user_profiles (user_id, email, password_hash, full_name, phone, role, metadata, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'worker', '{}', ?, ?)",
      ).run(workerId, workerEmail, workerPasswordHash, workerName, workerPhone, now, now);
      console.log("✅ Worker profile created.");
    }

    const mainWarehouseId = workplaceIds["Main Warehouse"];
    if (!mainWarehouseId) {
      throw new Error("Main Warehouse ID not found after seeding");
    }

    const existingAssignment = db
      .query<{ id: string }>(
        "SELECT id FROM worker_assignments WHERE worker_id = ? AND workplace_id = ? LIMIT 1",
      )
      .get(workerId, mainWarehouseId);

    if (!existingAssignment) {
      db.query(
        "INSERT INTO worker_assignments (id, worker_id, workplace_id, assigned_at) VALUES (?, ?, ?, ?)",
      ).run(randomUUID(), workerId, mainWarehouseId, now);
      console.log("🤝 Worker assignment created.");
    } else {
      console.log("📌 Worker already assigned to Main Warehouse.");
    }

    console.log("🕒 Seeding time entries...");

    const makeIso = (date: Date) => date.toISOString();
    const nowDate = new Date();
    const timeEntries = [
      {
        clock_in_at: makeIso(new Date(nowDate.getTime() - 2 * 24 * 60 * 60 * 1000 - 8 * 60 * 60 * 1000)),
        clock_out_at: makeIso(new Date(nowDate.getTime() - 2 * 24 * 60 * 60 * 1000 - 1 * 60 * 60 * 1000)),
      },
      {
        clock_in_at: makeIso(new Date(nowDate.getTime() - 1 * 24 * 60 * 60 * 1000 - 9 * 60 * 60 * 1000)),
        clock_out_at: makeIso(new Date(nowDate.getTime() - 1 * 24 * 60 * 60 * 1000 - 1 * 60 * 60 * 1000)),
      },
      {
        clock_in_at: makeIso(new Date(nowDate.getTime() - 4 * 60 * 60 * 1000)),
        clock_out_at: null,
      },
    ];

    for (const entry of timeEntries) {
      const duplicate = db
        .query<{ id: string }>(
          "SELECT id FROM time_entries WHERE worker_id = ? AND clock_in_at = ? LIMIT 1",
        )
        .get(workerId, entry.clock_in_at);

      if (duplicate) {
        console.log("⏱️  Time entry already exists for", entry.clock_in_at);
        continue;
      }

      db.query(
        "INSERT INTO time_entries (id, worker_id, workplace_id, clock_in_at, clock_out_at, method, notes, created_at) VALUES (?, ?, ?, ?, ?, 'seed', ?, ?)",
      ).run(
        randomUUID(),
        workerId,
        mainWarehouseId,
        entry.clock_in_at,
        entry.clock_out_at,
        entry.clock_out_at ? "Seeded shift" : "Currently active (seed)",
        now,
      );

      console.log("✅ Time entry seeded for", entry.clock_in_at);
    }

    console.log("\n🎉 Demo seed complete!");
    console.log(`Admin login: ${process.env.ADMIN_EMAIL ?? "admin@clockin.local"} / ${process.env.ADMIN_PASSWORD ?? "admin123"}`);
    console.log(`Worker login: ${workerEmail} / ${workerPassword}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("❌ Error seeding demo data:", message);
    console.error(error);
    process.exit(1);
  } finally {
    db.close();
  }
};

seedDemo();


