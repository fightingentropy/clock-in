const { Client } = require("pg");
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

async function runSchema() {
  loadEnv();

  const connectionString =
    process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

  if (!connectionString) {
    console.error(
      "❌ Error: POSTGRES_URL_NON_POOLING or POSTGRES_URL not found in environment variables",
    );
    process.exit(1);
  }

  // Parse connection string and remove SSL query params
  const url = new URL(connectionString);
  url.searchParams.delete("sslmode");
  url.searchParams.delete("supa");

  const client = new Client({
    connectionString: url.toString(),
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log("🔌 Connecting to database...");
    await client.connect();
    console.log("✅ Connected successfully");

    const schemaPath = path.join(__dirname, "..", "supabase", "schema.sql");
    console.log("📖 Reading schema file from:", schemaPath);

    const schema = fs.readFileSync(schemaPath, "utf8");

    console.log("🚀 Executing schema...");

    // Parse SQL statements properly, handling DO blocks and functions
    const statements = [];
    let currentStatement = "";
    let inDollarQuote = false;
    let dollarQuoteTag = "";

    const lines = schema.split("\n");

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Skip empty lines and comments when not in a statement
      if (!currentStatement && (!trimmedLine || trimmedLine.startsWith("--"))) {
        continue;
      }

      currentStatement += line + "\n";

      // Check for dollar quote tags ($$, $func$, etc.)
      const dollarMatches = line.match(/\$([a-zA-Z_]*)\$/g);
      if (dollarMatches) {
        for (const match of dollarMatches) {
          if (!inDollarQuote) {
            inDollarQuote = true;
            dollarQuoteTag = match;
          } else if (match === dollarQuoteTag) {
            inDollarQuote = false;
            dollarQuoteTag = "";
          }
        }
      }

      // If not in dollar quote and line ends with semicolon, it's end of statement
      if (!inDollarQuote && trimmedLine.endsWith(";")) {
        statements.push(currentStatement.trim());
        currentStatement = "";
      }
    }

    // Add any remaining statement
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await client.query(statement);
        console.log(`✅ Executed statement ${i + 1}/${statements.length}`);
      } catch (error) {
        console.error(`❌ Error in statement ${i + 1}:`, error.message);
        console.error(
          "Statement preview:",
          statement.substring(0, 150) + "...",
        );
        throw error;
      }
    }

    console.log("✅ Schema executed successfully!");
    console.log("");
    console.log("Your database is now set up with:");
    console.log("  - user_profiles table");
    console.log("  - workplaces table");
    console.log("  - worker_assignments table");
    console.log("  - time_entries table");
    console.log("");
    console.log(
      "You can now restart your Next.js app and the redirect loop should be fixed!",
    );
  } catch (error) {
    console.error("❌ Error executing schema:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
    console.log("🔌 Database connection closed");
  }
}

runSchema();
