"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

export const getSupabaseBrowserClient = (): SupabaseClient => {
  if (browserClient) {
    return browserClient;
  }

  const client = createClientComponentClient();
  browserClient = client;
  return client;
};
