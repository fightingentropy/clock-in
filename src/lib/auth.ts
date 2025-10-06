import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { getDialect } from "./db";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET is not set");
}

export const auth = betterAuth({
  appName: "Clock In",
  baseURL: appUrl,
  secret: process.env.BETTER_AUTH_SECRET,
  cookies: nextCookies(),
  database: {
    dialect: getDialect(),
    type: "postgres",
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "worker",
      },
    },
  },
});
