import { Role } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { enforceAuth } from '@/lib/api';

const bodySchema = z.object({
  userId: z.string(),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { session, error } = await enforceAuth(Role.ADMIN);

  if (!session) {
    return error;
  }

  const { id: workplaceId } = await context.params;
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: parsed.data.userId } });

  if (!user || user.role !== Role.WORKER) {
    return NextResponse.json({ error: 'Worker not found.' }, { status: 404 });
  }

  const assignment = await prisma.assignment.upsert({
    where: {
      userId_workplaceId: {
        userId: parsed.data.userId,
        workplaceId,
      },
    },
    update: {},
    create: {
      userId: parsed.data.userId,
      workplaceId,
    },
    include: { workplace: true, user: true },
  });

  return NextResponse.json(assignment, { status: 201 });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { session, error } = await enforceAuth(Role.ADMIN);

  if (!session) {
    return error;
  }

  const { id: workplaceId } = await context.params;
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId query parameter.' }, { status: 400 });
  }

  await prisma.assignment.delete({
    where: {
      userId_workplaceId: {
        userId,
        workplaceId,
      },
    },
  });

  return NextResponse.json({ success: true });
}
