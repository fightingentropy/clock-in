import { Role } from '@prisma/client';
import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { enforceAuth } from '@/lib/api';

export async function GET() {
  const { session, error } = await enforceAuth(Role.WORKER);

  if (!session) {
    return error;
  }

  const [assignments, activeEntry, recentEntries] = await prisma.$transaction([
    prisma.assignment.findMany({
      where: { userId: session.user.id },
      include: {
        workplace: true,
      },
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
      take: 10,
    }),
  ]);

  return NextResponse.json({
    assignments,
    activeEntry,
    recentEntries,
  });
}
