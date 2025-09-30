import { Role } from '@prisma/client';
import { redirect } from 'next/navigation';

import { AdminWorkplaceManagement } from '@/components/admin/workplace-management';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/session';

export default async function AdminWorkplacesPage() {
  const session = await getAuthSession();

  if (!session) {
    redirect('/login');
  }

  if (session.user.role !== Role.ADMIN) {
    redirect('/worker');
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

