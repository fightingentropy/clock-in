import type { Session } from "@supabase/supabase-js";

import { getSupabaseAdmin, getSupabaseServerComponentClient } from "./supabase";

export const getServerSession = async (): Promise<Session | null> => {
  const supabase = await getSupabaseServerComponentClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("Failed to retrieve Supabase session", error);
    return null;
  }

  return session;
};

export const requireSession = async () => {
  const session = await getServerSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
};

export const requireProfile = async () => {
  const session = await requireSession();
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    const metadata = (session.user.user_metadata ?? {}) as Record<string, unknown>;
    const fallbackRole = metadata.role === "admin" ? "admin" : "worker";
    const insertPayload = {
      user_id: session.user.id,
      email: session.user.email,
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
