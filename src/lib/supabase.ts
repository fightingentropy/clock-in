import { cookies } from "next/headers";
import {
  createRouteHandlerClient,
  createServerActionClient,
  createServerComponentClient,
} from "@supabase/auth-helpers-nextjs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type AdminClient = SupabaseClient;

type PublicClient = SupabaseClient;

let adminClient: AdminClient | null = null;
let publicClient: PublicClient | null = null;

const resolveSupabaseUrl = () => {
  return process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
};

const resolveAnonKey = () => {
  return process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
};

export const getSupabaseAdmin = () => {
  if (!adminClient) {
    const url = resolveSupabaseUrl();
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRoleKey) {
      throw new Error("Supabase admin credentials are not set");
    }
    adminClient = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }) as AdminClient;
  }
  return adminClient;
};

export const getSupabasePublic = () => {
  if (!publicClient) {
    const url = resolveSupabaseUrl();
    const anonKey = resolveAnonKey();
    if (!url || !anonKey) {
      throw new Error("Supabase public credentials are not set");
    }
    publicClient = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return publicClient;
};

export const getSupabaseServerComponentClient = () => {
  return createServerComponentClient({ cookies });
};

export const getSupabaseServerActionClient = () => {
  return createServerActionClient({ cookies });
};

export const getSupabaseRouteHandlerClient = () => {
  return createRouteHandlerClient({ cookies });
};
