import type { Session, User } from "@supabase/supabase-js";

import { getSupabaseAdmin, getSupabaseServerComponentClient } from "./supabase";

type AuthState = {
  session: Session | null;
  user: User | null;
};

const getServerAuthState = async (): Promise<AuthState> => {
  const supabase = await getSupabaseServerComponentClient();

  const [sessionResult, userResult] = await Promise.all([
    supabase.auth.getSession(),
    supabase.auth.getUser(),
  ]);

  if (sessionResult.error) {
    console.error("Failed to retrieve Supabase session", sessionResult.error);
  }

  if (userResult.error) {
    console.error("Failed to retrieve Supabase user", userResult.error);
  }

  return {
    session: sessionResult.data?.session ?? null,
    user: userResult.data?.user ?? null,
  };
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
    throw new Error("Unauthorized");
  }
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
    const fallbackRole = metadata.role === "admin" ? "admin" : "worker";
    const insertPayload = {
      user_id: user.id,
      email: user.email,
      full_name: (metadata.full_name as string | undefined) ?? (metadata.name as string | undefined) ?? null,
      role: fallbackRole,
    };
    const { data: created, error: createError } = await supabase
      .from("user_profiles")
      .insert(insertPayload)
      .select("*")
      .single();
    if (createError || !created) {
      throw new Error(createError?.message || "Unable to create profile");
    }
    return { session, profile: created };
  }

  return { session, profile: data };
};

export const requireAdmin = async () => {
  const { session, profile } = await requireProfile();
  if (profile.role !== "admin") {
    throw new Error("Forbidden");
  }
  return { session, profile };
};
