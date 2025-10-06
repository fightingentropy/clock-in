import { getMigrations } from "better-auth/db";
import { auth } from "@/lib/auth";

async function main() {
  const { runMigrations } = await getMigrations(auth.options);
  await runMigrations();
  console.log("Better Auth migrations executed");
  process.exit(0);
}

main().catch((error) => {
  console.error("Failed to run Better Auth migrations", error);
  process.exit(1);
});
