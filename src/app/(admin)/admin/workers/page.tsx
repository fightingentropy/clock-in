import { Role } from '@prisma/client';
import { redirect } from 'next/navigation';

import { AdminWorkerDirectory } from '@/components/admin/worker-directory';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/session';

export default async function AdminWorkersPage() {
  const session = await getAuthSession();

  if (!session) {
    redirect('/login');
  }

  if (session.user.role !== Role.ADMIN) {
    redirect('/worker');
  }

  const [workers, workplaces] = await Promise.all([
    prisma.user.findMany({
      where: { role: Role.WORKER },
      include: {
        assignments: {
          include: { workplace: true },
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.workplace.findMany({
      orderBy: { name: 'asc' },
    }),
  ]);

  return <AdminWorkerDirectory workers={workers} workplaces={workplaces} />;
}

