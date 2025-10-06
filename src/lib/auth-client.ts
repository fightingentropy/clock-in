"use client";

import { createAuthClient } from "better-auth/react";

export const client = createAuthClient({
  fetchOptions: {
    baseURL: "/api/auth",
  },
});

export const { useSession, signIn, signOut } = client;
