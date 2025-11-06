import type { Session, User } from "@supabase/supabase-js";

import { getSupabaseAdmin, getSupabaseServerComponentClient } from "./supabase";

type AuthState = {
  session: Session | null;
  user: User | null;
};

const getServerAuthState = async (): Promise<AuthState> => {
  const supabase = await getSupabaseServerComponentClient();

  const sessionResult = await supabase.auth.getSession();

  if (sessionResult.error) {
    console.error("Failed to retrieve Supabase session", sessionResult.error);
  }

  const session = sessionResult.data?.session ?? null;

  if (!session) {
    return { session: null, user: null };
  }

  try {
    const userResult = await supabase.auth.getUser();

    if (userResult.error) {
      console.error("Failed to retrieve Supabase user", userResult.error);
    }

    return {
      session,
      user: userResult.data?.user ?? null,
    };
  } catch (error) {
    console.error("Failed to retrieve Supabase user", error);
    return { session, user: null };
  }
};

export const getServerSession = async (): Promise<Session | null> => {
  const { session, user } = await getServerAuthState();
  if (!user) {
    return null;
  }
  return session;
};

export const requireSession = async (): Promise<Session> => {
  const { session, user } = await getServerAuthState();
  if (!session || !user) {
    throw new Error("Unauthorized");
  }
  return session;
};

export const requireProfile = async () => {
  const { session, user } = await getServerAuthState();
  if (!session || !user) {
    console.error("❌ requireProfile: No session or user found");
    throw new Error("Unauthorized");
  }
  console.log(
    "✅ requireProfile: Session and user verified for user_id:",
    user.id,
  );

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error(
      "❌ requireProfile: Error fetching profile from database:",
      error,
    );
    throw new Error(error.message);
  }

  if (!data) {
    console.log(
      "⚠️ requireProfile: No profile found, attempting to create one...",
    );
    const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
    const fallbackRole = metadata.role === "admin" ? "admin" : "worker";
    const insertPayload = {
      user_id: user.id,
      email: user.email,
      full_name:
        (metadata.full_name as string | undefined) ??
        (metadata.name as string | undefined) ??
        null,
      role: fallbackRole,
    };
    console.log(
      "📝 requireProfile: Creating profile with payload:",
      insertPayload,
    );
    const { data: created, error: createError } = await supabase
      .from("user_profiles")
      .insert(insertPayload)
      .select("*")
      .single();
    if (createError || !created) {
      console.error(
        "❌ requireProfile: Failed to create profile:",
        createError,
      );
      throw new Error(createError?.message || "Unable to create profile");
    }
    console.log("✅ requireProfile: Profile created successfully");
    return { session, profile: created, user };
  }

  console.log("✅ requireProfile: Profile found successfully");
  return { session, profile: data, user };
};

export const requireAdmin = async () => {
  const result = await requireProfile();
  if (result.profile.role !== "admin") {
    throw new Error("Forbidden");
  }
  return result;
};
