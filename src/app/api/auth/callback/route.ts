import { NextResponse } from "next/server";

import { getSupabaseRouteHandlerClient } from "@/lib/supabase";

export async function POST(request: Request) {
  const supabase = getSupabaseRouteHandlerClient();
  const { event, session } = await request.json();

  if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
    if (session) {
      await supabase.auth.setSession(session);
    }
  }

  if (event === "SIGNED_OUT") {
    await supabase.auth.signOut();
  }

  return NextResponse.json({ success: true });
}
