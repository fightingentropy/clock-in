import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const loadEnv = () => {
  const envPath = join(__dirname, "..", ".env.local");

  if (!existsSync(envPath)) {
    console.error("❌ Error: .env.local file not found");
    process.exit(1);
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

const deleteAdmin = async () => {
  loadEnv();

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error(
      "❌ Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in environment variables",
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const adminEmail = "admin@clockin.local";

  console.log("🔍 Searching for admin user:", adminEmail);

  try {
    const { data: existingUsers, error: listError } =
      await supabase.auth.admin.listUsers();

    if (listError) {
      throw listError;
    }

    const userToDelete = existingUsers.users.find(
      (user) => user.email === adminEmail,
    );

    if (!userToDelete) {
      console.log("⚠️  User not found:", adminEmail);
      console.log("No action needed - user does not exist.");
      return;
    }

    const userId = userToDelete.id;
    console.log("✓ Found user with ID:", userId);

    console.log("🗑️  Deleting user profile...");
    const { error: profileDeleteError } = await supabase
      .from("user_profiles")
      .delete()
      .eq("user_id", userId);

    if (profileDeleteError) {
      console.warn(
        "⚠️  Warning: Could not delete user profile:",
        profileDeleteError.message,
      );
    } else {
      console.log("✅ User profile deleted");
    }

    console.log("🗑️  Deleting auth user...");
    const { error: authDeleteError } =
      await supabase.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      throw authDeleteError;
    }

    console.log("✅ Auth user deleted");
    console.log("");
    console.log("🎉 Admin user deleted successfully!");
    console.log("  Email:", adminEmail);
    console.log("");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("❌ Error deleting admin:", message);
    console.error(error);
    process.exit(1);
  }
};

deleteAdmin();

