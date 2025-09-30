import { Role } from '@prisma/client';
import { redirect } from 'next/navigation';

import WorkerDashboard from '@/components/worker/dashboard';
import { ADMIN_ROUTE, LOGIN_ROUTE } from '@/lib/routes';
import { getAuthSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function WorkerPage() {
  const session = await getAuthSession();

  if (!session) {
    redirect(LOGIN_ROUTE);
  }

  if (session.user.role !== Role.WORKER) {
    redirect(ADMIN_ROUTE);
  }

  const [assignments, activeEntry, recentEntries] = await Promise.all([
    prisma.assignment.findMany({
      where: { userId: session.user.id },
      include: { workplace: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.timeEntry.findFirst({
      where: { userId: session.user.id, clockOutAt: null },
      include: { workplace: true },
      orderBy: { clockInAt: 'desc' },
    }),
    prisma.timeEntry.findMany({
      where: { userId: session.user.id },
      include: { workplace: true },
      orderBy: { clockInAt: 'desc' },
      take: 20,
    }),
  ]);

  return (
    <WorkerDashboard assignments={assignments} activeEntry={activeEntry} recentEntries={recentEntries} />
  );
}
