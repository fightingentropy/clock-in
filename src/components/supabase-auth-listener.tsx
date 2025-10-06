"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { onAuthStateChange } from "@/lib/auth-client";

const relevantEvents = new Set([
  "SIGNED_IN",
  "SIGNED_OUT",
  "TOKEN_REFRESHED",
]);

const SupabaseAuthListener = () => {
  const router = useRouter();

  useEffect(() => {
    const { data } = onAuthStateChange(async (event, session) => {
      if (!relevantEvents.has(event)) {
        return;
      }

      try {
        await fetch("/api/auth/callback", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ event, session }),
        });
      } catch (error) {
        console.error("Failed to sync Supabase auth state", error);
      }

      router.refresh();
    });

    return () => {
      data?.subscription.unsubscribe();
    };
  }, [router]);

  return null;
};

export default SupabaseAuthListener;
