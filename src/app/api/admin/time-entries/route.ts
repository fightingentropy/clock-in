import { Role } from '@prisma/client';
import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { enforceAuth } from '@/lib/api';

export async function GET(request: Request) {
  const { session, error } = await enforceAuth(Role.ADMIN);

  if (!session) {
    return error;
  }

  const { searchParams } = new URL(request.url);
  const perPage = Number(searchParams.get('take') ?? 20);

  const entries = await prisma.timeEntry.findMany({
    include: {
      user: true,
      workplace: true,
    },
    orderBy: { clockInAt: 'desc' },
    take: Math.min(Math.max(perPage, 1), 100),
  });

  return NextResponse.json(entries);
}
