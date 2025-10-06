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

async function createAdmin() {
  loadEnv();

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error(
      "❌ Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in environment variables"
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
    // Check if user exists
    const { data: existingUsers, error: listError } =
      await supabase.auth.admin.listUsers();

    if (listError) {
      throw listError;
    }

    const existingUser = existingUsers.users.find(
      (user) => user.email === adminEmail
    );

    let userId;

    if (existingUser) {
      console.log("👤 User already exists, updating password...");
      userId = existingUser.id;

      // Update password
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        {
          password: adminPassword,
          user_metadata: {
            role: "admin",
          },
        }
      );

      if (updateError) {
        throw updateError;
      }

      console.log("✅ Password updated successfully");
    } else {
      console.log("➕ Creating new admin user...");

      // Create new user
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

      if (createError) {
        throw createError;
      }

      userId = newUser.user.id;
      console.log("✅ Admin user created successfully");
    }

    // Check if profile exists in user_profiles table
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
      // Update existing profile to ensure admin role
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
      // Create new profile
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
    console.error("❌ Error setting up admin:", error.message);
    console.error(error);
    process.exit(1);
  }
}

createAdmin();
