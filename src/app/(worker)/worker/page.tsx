import WorkerDashboard from '@/components/worker/dashboard';
import { requireRole } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function WorkerPage() {
  const session = await requireRole('WORKER');

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
