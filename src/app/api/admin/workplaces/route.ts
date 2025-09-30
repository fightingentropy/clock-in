import { Role } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { enforceAuth } from '@/lib/api';

const payloadSchema = z.object({
  name: z.string().min(2),
  latitude: z.number().refine((value) => Math.abs(value) <= 90, 'Latitude must be between -90 and 90'),
  longitude: z.number().refine((value) => Math.abs(value) <= 180, 'Longitude must be between -180 and 180'),
  radiusMeters: z.number().min(10).max(1000).default(50),
  address: z.string().optional(),
});

export async function GET() {
  const { session, error } = await enforceAuth(Role.ADMIN);

  if (!session) {
    return error;
  }

  const workplaces = await prisma.workplace.findMany({
    include: {
      _count: {
        select: { assignments: true },
      },
      assignments: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(workplaces);
}

export async function POST(request: Request) {
  const { session, error } = await enforceAuth(Role.ADMIN);

  if (!session) {
    return error;
  }

  const json = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
  }

  const workplace = await prisma.workplace.create({
    data: parsed.data,
  });

  return NextResponse.json(workplace, { status: 201 });
}
