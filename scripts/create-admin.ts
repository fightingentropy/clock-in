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

const createAdmin = async () => {
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

  const adminEmail = "erlin.hx@gmail.com";
  const adminPassword = "erlin123";

  console.log("🔍 Checking if admin user exists...");

  try {
    const { data: existingUsers, error: listError } =
      await supabase.auth.admin.listUsers();

    if (listError) {
      throw listError;
    }

    const existingUser = existingUsers.users.find(
      (user) => user.email === adminEmail,
    );

    let userId: string;

    if (existingUser) {
      console.log("👤 User already exists, updating password...");
      userId = existingUser.id;

      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        {
          password: adminPassword,
          user_metadata: {
            role: "admin",
          },
        },
      );

      if (updateError) {
        throw updateError;
      }

      console.log("✅ Password updated successfully");
    } else {
      console.log("➕ Creating new admin user...");

      const { data: newUser, error: createError } =
        await supabase.auth.admin.createUser({
          email: adminEmail,
          password: adminPassword,
          email_confirm: true,
          user_metadata: {
            role: "admin",
            full_name: "Admin User",
          },
        });

      if (createError || !newUser?.user) {
        throw createError ?? new Error("Failed to create admin user");
      }

      userId = newUser.user.id;
      console.log("✅ Admin user created successfully");
    }

    console.log("🔍 Checking user profile...");
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    if (profile) {
      console.log("📝 Updating profile to admin role...");
      const { error: updateProfileError } = await supabase
        .from("user_profiles")
        .update({
          role: "admin",
          email: adminEmail,
        })
        .eq("user_id", userId);

      if (updateProfileError) {
        throw updateProfileError;
      }

      console.log("✅ Profile updated to admin role");
    } else {
      console.log("➕ Creating admin profile...");
      const { error: insertProfileError } = await supabase
        .from("user_profiles")
        .insert({
          user_id: userId,
          email: adminEmail,
          full_name: "Admin User",
          role: "admin",
        });

      if (insertProfileError) {
        throw insertProfileError;
      }

      console.log("✅ Admin profile created");
    }

    console.log("");
    console.log("🎉 Admin user setup complete!");
    console.log("");
    console.log("Login credentials:");
    console.log("  Email:", adminEmail);
    console.log("  Password:", adminPassword);
    console.log("");
    console.log("You can now log in to your Clock In Portal!");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("❌ Error setting up admin:", message);
    console.error(error);
    process.exit(1);
  }
};

createAdmin();

