import { AdminWorkplaceManagement } from '@/components/admin/workplace-management';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminWorkplacesPage() {
  await requireRole('ADMIN');

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
