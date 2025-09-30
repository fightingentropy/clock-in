import { Role } from '@prisma/client';
import { redirect } from 'next/navigation';

import { AdminWorkplaceManagement } from '@/components/admin/workplace-management';
import { prisma } from '@/lib/prisma';
import { LOGIN_ROUTE, WORKER_ROUTE } from '@/lib/routes';
import { getAuthSession } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminWorkplacesPage() {
  const session = await getAuthSession();

  if (!session) {
    redirect(LOGIN_ROUTE);
  }

  if (session.user.role !== Role.ADMIN) {
    redirect(WORKER_ROUTE);
  }

  const workplaces = await prisma.workplace.findMany({
    include: {
      assignments: {
        include: { user: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  return <AdminWorkplaceManagement workplaces={workplaces} />;
}
