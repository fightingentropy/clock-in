import { Role } from '@prisma/client';

import AdminDashboard from '@/components/admin/dashboard';
import { requireRole } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminPage() {
  await requireRole('ADMIN');

  const [workers, workplacesCount, recentEntries] = await Promise.all([
    prisma.user.findMany({
      where: { role: Role.WORKER },
      include: {
        assignments: {
          include: { workplace: true },
        },
        timeEntries: {
          where: { clockOutAt: null },
          include: { workplace: true },
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.workplace.count(),
    prisma.timeEntry.findMany({
      include: {
        user: true,
        workplace: true,
      },
      orderBy: { clockInAt: 'desc' },
      take: 50,
    }),
  ]);

  return <AdminDashboard workers={workers} workplacesCount={workplacesCount} recentEntries={recentEntries} />;
}
