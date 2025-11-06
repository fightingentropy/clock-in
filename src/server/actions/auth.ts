"use server";

import { z } from "zod";

import { getDb } from "@/lib/db";
import {
  SESSION_COOKIE_NAME,
  clearSessionCookie,
  createSession,
  deleteSession,
  setSessionCookie,
} from "@/lib/session";
import { cookies } from "next/headers";

type UserCredentialRow = {
  user_id: string;
  email: string;
  password_hash: string;
  full_name: string | null;
  role: "admin" | "worker";
};

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type AuthResult = {
  success: boolean;
  error?: string;
};

const fetchUserByEmail = (email: string): UserCredentialRow | null => {
  const db = getDb();
  return db
    .query<UserCredentialRow>(
      "SELECT user_id, email, password_hash, full_name, role FROM user_profiles WHERE email = ? LIMIT 1",
    )
    .get(email);
};

export const loginWithEmail = async (values: { email: string; password: string }): Promise<AuthResult> => {
  const parseResult = loginSchema.safeParse(values);

  if (!parseResult.success) {
    return {
      success: false,
      error: "Invalid email or password",
    };
  }

  const input = parseResult.data;
  const record = fetchUserByEmail(input.email);

  if (!record) {
    return { success: false, error: "Invalid credentials" };
  }

  const passwordValid = await Bun.password.verify(input.password, record.password_hash);

  if (!passwordValid) {
    return { success: false, error: "Invalid credentials" };
  }

  const session = createSession(record.user_id);
  await setSessionCookie(session);

  return { success: true };
};

export const logout = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    deleteSession(token);
  }

  await clearSessionCookie();
};

