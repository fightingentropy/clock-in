import type { Metadata, Viewport } from 'next';
import { Providers } from '@/components/providers';
import Navbar from '@/components/navbar';
import { getAuthSession } from '@/lib/session';
import { cn } from '@/lib/utils';
import './globals.css';

export const metadata: Metadata = {
  title: 'Clock In HQ',
  description: 'Location-aware workforce attendance PWA for teams.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getAuthSession();

  return (
    <html lang="en" className="dark">
      <body
        className={cn(
          'flex min-h-screen flex-col bg-neutral-950 font-sans text-neutral-100 antialiased'
        )}
      >
        <Providers session={session}>
          <Navbar />
          <main className="flex-1">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
