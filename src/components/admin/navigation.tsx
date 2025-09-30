'use client';

import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { LOGIN_ROUTE } from '@/lib/routes';

const SECTIONS = [
  { label: 'Operations dashboard', href: '/admin' },
  { label: 'Workplaces', href: '/admin/workplaces' },
  { label: 'Worker directory', href: '/admin/workers' },
];

export function AdminNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="border-neutral-700 bg-neutral-900 text-neutral-100">
          Menu
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 border-neutral-800 bg-neutral-900 text-neutral-100"
      >
        <DropdownMenuLabel>Sections</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {SECTIONS.map((section) => {
          const isActive = pathname === section.href;

          return (
            <DropdownMenuItem
              key={section.href}
              onSelect={() => {
                if (!isActive) {
                  router.push(section.href);
                }
              }}
              className={cn('cursor-pointer', isActive && 'font-semibold text-neutral-100')}
            >
              {section.label}
              {isActive ? <span className="ml-auto text-xs text-emerald-400">Current</span> : null}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            signOut({ callbackUrl: LOGIN_ROUTE });
          }}
          className="cursor-pointer text-red-400 focus:text-red-300"
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
