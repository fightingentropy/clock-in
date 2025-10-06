import { cookies } from "next/headers";
import { auth } from "./auth";
import { getSupabaseAdmin } from "./supabase";

export interface SessionPayload {
  session: Record<string, unknown>;
  user: Record<string, unknown>;
}

export const getServerSession = async (): Promise<SessionPayload | null> => {
  const cookieStore = cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((entry) => `${entry.name}=${entry.value}`)
    .join("; ");

  const result = await auth.api.getSession({
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  });

  if (!result || !result.data) {
    return null;
  }

  return result.data as SessionPayload;
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
    const fallbackRole = (session.user.role as string | undefined) === "admin" ? "admin" : "worker";
    const insertPayload = {
      user_id: session.user.id,
      email: session.user.email,
      full_name: session.user.name ?? null,
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
