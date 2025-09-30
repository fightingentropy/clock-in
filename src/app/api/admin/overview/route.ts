import { Role } from '@prisma/client';
import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { enforceAuth } from '@/lib/api';

export async function GET() {
  const { session, error } = await enforceAuth(Role.ADMIN);

  if (!session) {
    return error;
  }

  const [workers, workplaces, recentEntries] = await Promise.all([
    prisma.user.findMany({
      where: { role: Role.WORKER },
      select: {
        id: true,
        name: true,
        email: true,
        assignments: {
          include: {
            workplace: true,
          },
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
        _count: {
          select: { assignments: true },
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
      take: 20,
    }),
  ]);

  const workerSummaries = workers.map((worker) => {
    const activeEntry = worker.timeEntries[0] ?? null;
    return {
      id: worker.id,
      name: worker.name,
      email: worker.email,
      assignments: worker.assignments.map((assignment) => assignment.workplace),
      activeEntry,
    };
  });

  return NextResponse.json({
    workers: workerSummaries,
    workplaces,
    recentEntries,
  });
}
