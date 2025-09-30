import { Role } from '@prisma/client';
import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { enforceAuth } from '@/lib/api';

export async function GET() {
  const { session, error } = await enforceAuth(Role.ADMIN);

  if (!session) {
    return error;
  }

  const workers = await prisma.user.findMany({
    where: { role: Role.WORKER },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(workers);
}
