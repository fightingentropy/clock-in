import { AdminWorkerDirectory } from '@/components/admin/worker-directory';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/session';
import { Role } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminWorkersPage() {
  await requireRole('ADMIN');

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
