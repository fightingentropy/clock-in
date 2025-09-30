import { Prisma, Role } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { enforceAuth } from '@/lib/api';
import { prisma } from '@/lib/prisma';

const updateWorkerSchema = z.object({
  name: z.string().min(2, 'Name is required.'),
  email: z.string().email('Provide a valid email address.'),
  workplaceIds: z.array(z.string()).default([]),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ workerId: string }> }
) {
  const { session, error } = await enforceAuth(Role.ADMIN);

  if (!session) {
    return error;
  }

  const { workerId } = await context.params;

  const payload = await request.json().catch(() => null);

  const parsed = updateWorkerSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload.', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, email, workplaceIds } = parsed.data;

  try {
    const worker = await prisma.user.findFirst({
      where: { id: workerId, role: Role.WORKER },
      select: { id: true },
    });

    if (!worker) {
      return NextResponse.json({ error: 'Worker not found.' }, { status: 404 });
    }

    const desiredIds = Array.from(new Set(workplaceIds));

    const validWorkplaces = await prisma.workplace.findMany({
      where: { id: { in: desiredIds } },
      select: { id: true },
    });

    if (validWorkplaces.length !== desiredIds.length) {
      return NextResponse.json({ error: 'One or more workplaces were not found.' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: workerId },
        data: { name, email },
      });

      const currentAssignments = await tx.assignment.findMany({
        where: { userId: workerId },
        select: { workplaceId: true },
      });

      const currentIds = new Set(currentAssignments.map((assignment) => assignment.workplaceId));
      const nextIds = new Set(desiredIds);

      const toRemove = Array.from(currentIds).filter((id) => !nextIds.has(id));
      const toAdd = Array.from(nextIds).filter((id) => !currentIds.has(id));

      if (toRemove.length > 0) {
        await tx.assignment.deleteMany({
          where: {
            userId: workerId,
            workplaceId: { in: toRemove },
          },
        });
      }

      if (toAdd.length > 0) {
        await tx.assignment.createMany({
          data: toAdd.map((workplaceId) => ({ userId: workerId, workplaceId })),
        });
      }
    });

    const updatedWorker = await prisma.user.findUnique({
      where: { id: workerId },
      include: {
        assignments: {
          include: { workplace: true },
        },
      },
    });

    return NextResponse.json(updatedWorker);
  } catch (caught) {
    if (caught instanceof Prisma.PrismaClientKnownRequestError) {
      if (caught.code === 'P2002') {
        return NextResponse.json({ error: 'Email is already in use.' }, { status: 409 });
      }
    }

    console.error(caught);
    return NextResponse.json({ error: 'Failed to update worker.' }, { status: 500 });
  }
}
