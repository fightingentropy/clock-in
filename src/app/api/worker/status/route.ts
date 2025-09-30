import { Role } from '@prisma/client';
import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { enforceAuth } from '@/lib/api';

export async function GET() {
  const { session, error } = await enforceAuth(Role.WORKER);

  if (!session) {
    return error;
  }

  const assignments = await prisma.assignment.findMany({
    where: { userId: session.user.id },
    include: {
      workplace: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const activeEntry = await prisma.timeEntry.findFirst({
    where: { userId: session.user.id, clockOutAt: null },
    include: { workplace: true },
    orderBy: { clockInAt: 'desc' },
  });

  const recentEntries = await prisma.timeEntry.findMany({
    where: { userId: session.user.id },
    include: { workplace: true },
    orderBy: { clockInAt: 'desc' },
    take: 10,
  });

  return NextResponse.json({
    assignments,
    activeEntry,
    recentEntries,
  });
}
