'use client';

import type { Assignment, TimeEntry, User, Workplace } from '@prisma/client';
import { differenceInMinutes, format } from 'date-fns';
import { useMemo } from 'react';

import { AdminNavigation } from '@/components/admin/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatMinutes } from '@/lib/utils';
import { useNow } from '@/hooks/use-now';
import { useHydrated } from '@/hooks/use-hydrated';

interface AdminDashboardProps {
  workers: (User & {
    assignments: (Assignment & { workplace: Workplace })[];
    timeEntries: (TimeEntry & { workplace: Workplace })[];
  })[];
  workplacesCount: number;
  recentEntries: (TimeEntry & { user: User; workplace: Workplace })[];
}

export default function AdminDashboard({ workers, workplacesCount, recentEntries }: AdminDashboardProps) {
  const activeWorkers = useMemo(
    () => workers.filter((worker) => worker.timeEntries.some((entry) => !entry.clockOutAt)),
    [workers]
  );
  const now = useNow();
  const isHydrated = useHydrated();

  const formatTime = (value: Date | string, pattern: string) => {
    if (!isHydrated) {
      return '—';
    }

    return format(new Date(value), pattern);
  };


  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold">Operations dashboard</h1>
          <p className="text-sm text-neutral-400">
            Monitor attendance in real time, manage workplaces, and control worker access.
          </p>
        </div>
        <AdminNavigation />
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="border-neutral-800 bg-neutral-900/60">
          <CardHeader>
            <CardDescription>Total workers</CardDescription>
            <CardTitle className="text-3xl">{workers.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-neutral-800 bg-neutral-900/60">
          <CardHeader>
            <CardDescription>Active now</CardDescription>
            <CardTitle className="text-3xl">{activeWorkers.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-neutral-800 bg-neutral-900/60">
          <CardHeader>
            <CardDescription>Workplaces</CardDescription>
            <CardTitle className="text-3xl">{workplacesCount}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent shifts</h2>
          <span className="text-sm text-neutral-400">Showing last {recentEntries.length} entries</span>
        </div>
        <Card className="border-neutral-800 bg-neutral-900/60">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-neutral-800">
                  <TableHead>Worker</TableHead>
                  <TableHead>Workplace</TableHead>
                  <TableHead className="hidden md:table-cell">Clock in</TableHead>
                  <TableHead className="hidden md:table-cell">Clock out</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-neutral-500">
                      No shifts recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentEntries.map((entry) => {
                    const clockOutTime = entry.clockOutAt
                      ? new Date(entry.clockOutAt)
                      : now !== null
                        ? new Date(now)
                        : null;
                    const durationMinutes = clockOutTime
                      ? differenceInMinutes(clockOutTime, new Date(entry.clockInAt))
                      : null;

                    return (
                      <TableRow key={entry.id} className="border-neutral-900">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{entry.user.name}</span>
                            <span className="text-xs text-neutral-500">{entry.user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>{entry.workplace.name}</TableCell>
                        <TableCell className="hidden md:table-cell">{formatTime(entry.clockInAt, 'MMM d, p')}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {entry.clockOutAt ? formatTime(entry.clockOutAt, 'MMM d, p') : 'Active'}
                        </TableCell>
                        <TableCell className="text-right">{formatMinutes(durationMinutes)}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <Separator className="border-neutral-900" />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Active workers</h2>
        {activeWorkers.length === 0 ? (
          <p className="text-sm text-neutral-500">No one is clocked in right now.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {activeWorkers.map((worker) => {
              const entry = worker.timeEntries[0];
              if (!entry) return null;
              return (
                <Card key={worker.id} className="border-emerald-800 bg-emerald-900/20">
                  <CardHeader>
                    <CardTitle className="text-lg">{worker.name}</CardTitle>
                    <CardDescription>
                      On-site at {entry.workplace.name} since {formatTime(entry.clockInAt, 'p')}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
