'use client';

import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';
import { type ReactNode } from 'react';
import { Toaster } from 'sonner';

import { PWARegister } from './pwa-register';

export function Providers({ children, session }: { children: ReactNode; session: Session | null }) {
  return (
    <SessionProvider session={session}>
      {children}
      <Toaster richColors position="bottom-right" theme="dark" />
      <PWARegister />
    </SessionProvider>
  );
}
