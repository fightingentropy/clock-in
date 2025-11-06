import { SQL } from "bun";
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

const runSchema = async () => {
  loadEnv();

  const connectionString =
    process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;

  if (!connectionString) {
    console.error(
      "❌ Error: POSTGRES_URL_NON_POOLING or POSTGRES_URL not found in environment variables",
    );
    process.exit(1);
  }

  try {
    const schemaPath = join(__dirname, "..", "supabase", "schema.sql");
    console.log("📖 Reading schema file from:", schemaPath);

    const schema = readFileSync(schemaPath, "utf8");

    console.log("🚀 Executing schema...");

    const statements: string[] = [];
    let currentStatement = "";
    let inDollarQuote = false;
    let dollarQuoteTag = "";

    const lines = schema.split("\n");

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (!currentStatement && (!trimmedLine || trimmedLine.startsWith("--"))) {
        continue;
      }

      currentStatement += `${line}\n`;

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

      if (!inDollarQuote && trimmedLine.endsWith(";")) {
        statements.push(currentStatement.trim());
        currentStatement = "";
      }
    }

    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    const sql = new SQL(connectionString);

    try {
      for (let index = 0; index < statements.length; index += 1) {
        const statement = statements[index];
        try {
          await sql.unsafe(statement);
          console.log(`✅ Executed statement ${index + 1}/${statements.length}`);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          console.error(`❌ Error in statement ${index + 1}:`, message);
          console.error(
            "Statement preview:",
            `${statement.substring(0, 150)}...`,
          );
          throw error;
        }
      }
    } finally {
      await sql.close();
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
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("❌ Error executing schema:", message);
    console.error(error);
    process.exit(1);
  }
};

runSchema();

