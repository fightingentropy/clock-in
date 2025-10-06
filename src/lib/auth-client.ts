"use client";

import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

import { getSupabaseBrowserClient } from "./supabase-browser";

export const signInWithEmail = async (params: { email: string; password: string }) => {
  const supabase = getSupabaseBrowserClient();
  return supabase.auth.signInWithPassword(params);
};

export const signOut = async () => {
  const supabase = getSupabaseBrowserClient();
  return supabase.auth.signOut();
};

export const getBrowserSession = async () => {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
};

export const onAuthStateChange = (
  callback: (event: AuthChangeEvent, session: Session | null) => void,
) => {
  const supabase = getSupabaseBrowserClient();
  return supabase.auth.onAuthStateChange(callback);
};
