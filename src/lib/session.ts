import { randomBytes } from "node:crypto";

import { cookies } from "next/headers";

import { getDb, nowIso } from "./db";
import type { UserProfile } from "./types";

export type AppSession = {
  token: string;
  user_id: string;
  expires_at: string;
};

type SessionRow = {
  token: string;
  user_id: string;
  expires_at: string;
};

type UserProfileRow = {
  user_id: string;
  email: string;
  password_hash: string;
  full_name: string | null;
  phone: string | null;
  role: "admin" | "worker";
  avatar_url: string | null;
  metadata: string | null;
  created_at: string;
  updated_at: string;
};

type AuthState = {
  session: AppSession | null;
  profile: UserProfile | null;
};

export const SESSION_COOKIE_NAME = "clockin_session";
export const DEFAULT_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

const parseMetadata = (value: string | null): Record<string, unknown> | null => {
  if (!value) {
    return null;
  }
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && parsed ? (parsed as Record<string, unknown>) : null;
  } catch (error) {
    console.warn("⚠️  Failed to parse metadata JSON", error);
    return null;
  }
};

const mapProfile = (row: UserProfileRow): UserProfile => ({
  user_id: row.user_id,
  email: row.email,
  full_name: row.full_name,
  phone: row.phone,
  role: row.role,
  avatar_url: row.avatar_url,
  metadata: parseMetadata(row.metadata),
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const fetchProfile = (userId: string): UserProfile | null => {
  const db = getDb();
  const row = db
    .query<UserProfileRow>(
      "SELECT user_id, email, password_hash, full_name, phone, role, avatar_url, metadata, created_at, updated_at FROM user_profiles WHERE user_id = ? LIMIT 1",
    )
    .get(userId);
  return row ? mapProfile(row) : null;
};

const cleanupSession = (token: string) => {
  const db = getDb();
  db.query("DELETE FROM sessions WHERE token = ?").run(token);
};

const getServerAuthState = async (): Promise<AuthState> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return { session: null, profile: null };
  }

  const db = getDb();
  const sessionRow = db
    .query<SessionRow>(
      "SELECT token, user_id, expires_at FROM sessions WHERE token = ? LIMIT 1",
    )
    .get(token);

  if (!sessionRow) {
    cookieStore.delete(SESSION_COOKIE_NAME);
    return { session: null, profile: null };
  }

  const expiresAt = new Date(sessionRow.expires_at).getTime();
  if (Number.isNaN(expiresAt) || expiresAt <= Date.now()) {
    cleanupSession(sessionRow.token);
    cookieStore.delete({ name: SESSION_COOKIE_NAME, path: "/" });
    return { session: null, profile: null };
  }

  const profile = fetchProfile(sessionRow.user_id);

  if (!profile) {
    cleanupSession(sessionRow.token);
    cookieStore.delete({ name: SESSION_COOKIE_NAME, path: "/" });
    return { session: null, profile: null };
  }

  return {
    session: {
      token: sessionRow.token,
      user_id: sessionRow.user_id,
      expires_at: sessionRow.expires_at,
    },
    profile,
  };
};

export const getServerSession = async (): Promise<AppSession | null> => {
  const { session } = await getServerAuthState();
  return session;
};

export const requireSession = async (): Promise<AppSession> => {
  const { session } = await getServerAuthState();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
};

export const requireProfile = async () => {
  const { session, profile } = await getServerAuthState();
  if (!session || !profile) {
    throw new Error("Unauthorized");
  }
  return { session, profile };
};

export const requireAdmin = async () => {
  const result = await requireProfile();
  if (result.profile.role !== "admin") {
    throw new Error("Forbidden");
  }
  return result;
};

export const createSession = (userId: string, ttlMs = DEFAULT_SESSION_TTL_MS): AppSession => {
  const db = getDb();
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + ttlMs).toISOString();
  const createdAt = nowIso();

  db.query(
    "INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
  ).run(token, userId, expiresAt, createdAt);

  return {
    token,
    user_id: userId,
    expires_at: expiresAt,
  };
};

export const deleteSession = (token: string) => {
  cleanupSession(token);
};

export const setSessionCookie = async (session: AppSession) => {
  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: session.token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(session.expires_at),
  });
};

export const clearSessionCookie = async () => {
  const cookieStore = await cookies();
  cookieStore.delete({ name: SESSION_COOKIE_NAME, path: "/" });
};
