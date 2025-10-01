'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { MenuIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ADMIN_ROUTE, HOME_ROUTE, LOGIN_ROUTE, WORKER_ROUTE } from '@/lib/routes';
import { cn } from '@/lib/utils';

type NavLink = {
  href: string;
  label: string;
};

const ADMIN_LINKS: NavLink[] = [
  { label: 'Dashboard', href: ADMIN_ROUTE },
  { label: 'Workplaces', href: '/admin/workplaces' },
  { label: 'Workers', href: '/admin/workers' },
];

const WORKER_LINKS: NavLink[] = [{ label: 'Dashboard', href: WORKER_ROUTE }];

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = session?.user?.role;

  const links = useMemo<NavLink[]>(() => {
    if (role === 'ADMIN') {
      return ADMIN_LINKS;
    }

    if (role === 'WORKER') {
      return WORKER_LINKS;
    }

    return [];
  }, [role]);

  const activeClass = (href: string) =>
    cn(
      'rounded-md px-3 py-2 text-sm font-medium transition-colors',
      pathname === href
        ? 'bg-neutral-800 text-neutral-100'
        : 'text-neutral-300 hover:bg-neutral-800/60 hover:text-neutral-50'
    );

  const handleSignOut = () => {
    signOut({ callbackUrl: LOGIN_ROUTE });
  };

  const homeHref = role === 'ADMIN' ? ADMIN_ROUTE : role === 'WORKER' ? WORKER_ROUTE : HOME_ROUTE;

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-neutral-950/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href={homeHref}
          className="text-base font-semibold tracking-tight text-neutral-100 transition hover:text-neutral-50"
        >
          Clock In HQ
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={activeClass(link.href)}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {session?.user?.name ? (
            <span className="hidden text-sm text-neutral-400 sm:block">
              {session.user.name.split(' ')[0] ? `Hi, ${session.user.name.split(' ')[0]}` : session.user.name}
            </span>
          ) : null}
          {session ? (
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          ) : (
            <Button size="sm" asChild>
              <Link href={LOGIN_ROUTE}>Sign in</Link>
            </Button>
          )}

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Toggle navigation menu"
              >
                <MenuIcon className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="border-neutral-800 bg-neutral-950/95 text-neutral-100">
              <div className="flex flex-col gap-6 py-6">
                <div className="px-1 text-lg font-semibold">Clock In HQ</div>
                {links.length > 0 ? (
                  <>
                    <Separator className="bg-neutral-800" />
                    <nav className="flex flex-col gap-1">
                      {links.map((link) => (
                        <SheetClose asChild key={link.href}>
                          <Link
                            href={link.href}
                            className={cn(
                              'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-neutral-800/80 hover:text-neutral-50',
                              pathname === link.href && 'bg-neutral-800 text-neutral-100'
                            )}
                          >
                            {link.label}
                          </Link>
                        </SheetClose>
                      ))}
                    </nav>
                  </>
                ) : null}

                <Separator className="bg-neutral-800" />

                {session ? (
                  <Button onClick={handleSignOut} className="w-full">
                    Sign out
                  </Button>
                ) : (
                  <Button asChild className="w-full">
                    <Link href={LOGIN_ROUTE}>Sign in</Link>
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

export default Navbar;

