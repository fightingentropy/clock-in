import { Role } from '@prisma/client';
import { redirect } from 'next/navigation';

import { AdminWorkerDirectory } from '@/components/admin/worker-directory';
import { prisma } from '@/lib/prisma';
import { LOGIN_ROUTE, WORKER_ROUTE } from '@/lib/routes';
import { getAuthSession } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminWorkersPage() {
  const session = await getAuthSession();

  if (!session) {
    redirect(LOGIN_ROUTE);
  }

  if (session.user.role !== Role.ADMIN) {
    redirect(WORKER_ROUTE);
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
