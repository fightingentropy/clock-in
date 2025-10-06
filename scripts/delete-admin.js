const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Load .env.local file
function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error("❌ Error: .env.local file not found");
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, "utf8");
  const lines = envContent.split("\n");

  lines.forEach((line) => {
    // Skip empty lines and comments
    if (!line.trim() || line.trim().startsWith("#")) return;

    // Parse KEY=VALUE
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();

      // Remove surrounding quotes if present
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      process.env[key] = value;
    }
  });
}

async function deleteAdmin() {
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
    // Find the user by email
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

    // Delete from user_profiles table first (to avoid foreign key constraint issues)
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

    // Delete from auth.users
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
    console.error("❌ Error deleting admin:", error.message);
    console.error(error);
    process.exit(1);
  }
}

deleteAdmin();
