import { Role } from '@prisma/client';
import { redirect } from 'next/navigation';

import AdminDashboard from '@/components/admin/dashboard';
import { getAuthSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export default async function AdminPage() {
  const session = await getAuthSession();

  if (!session) {
    redirect('/login');
  }

  if (session.user.role !== Role.ADMIN) {
    redirect('/worker');
  }

  const [workers, workplaces, recentEntries] = await Promise.all([
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
    prisma.workplace.findMany({
      include: {
        assignments: {
          include: { user: true },
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.timeEntry.findMany({
      include: {
        user: true,
        workplace: true,
      },
      orderBy: { clockInAt: 'desc' },
      take: 50,
    }),
  ]);

  return <AdminDashboard workers={workers} workplaces={workplaces} recentEntries={recentEntries} />;
}
