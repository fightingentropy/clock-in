import { Prisma, Role } from '@prisma/client';
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { hash } from 'bcryptjs';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { enforceAuth } from '@/lib/api';

const createWorkerSchema = z.object({
  name: z.string().min(2, 'Name is required.'),
  email: z.string().email('Provide a valid email address.'),
  workplaceIds: z.array(z.string()).default([]),
});

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

export async function POST(request: Request) {
  const { session, error } = await enforceAuth(Role.ADMIN);

  if (!session) {
    return error;
  }

  const payload = await request.json().catch(() => null);
  const parsed = createWorkerSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload.', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, email, workplaceIds } = parsed.data;
  const desiredIds = Array.from(new Set(workplaceIds));

  try {
    const validWorkplaces = await prisma.workplace.findMany({
      where: { id: { in: desiredIds } },
      select: { id: true },
    });

    if (validWorkplaces.length !== desiredIds.length) {
      return NextResponse.json({ error: 'One or more workplaces were not found.' }, { status: 400 });
    }

    const temporaryPassword = randomBytes(9).toString('base64url');
    const passwordHash = await hash(temporaryPassword, 10);

    const worker = await prisma.$transaction(async (tx) => {
      const createdWorker = await tx.user.create({
        data: {
          name,
          email,
          role: Role.WORKER,
          passwordHash,
        },
      });

      if (desiredIds.length > 0) {
        await tx.assignment.createMany({
          data: desiredIds.map((workplaceId) => ({
            userId: createdWorker.id,
            workplaceId,
          })),
        });
      }

      return tx.user.findUnique({
        where: { id: createdWorker.id },
        include: {
          assignments: {
            include: { workplace: true },
          },
        },
      });
    });

    if (!worker) {
      return NextResponse.json({ error: 'Failed to create worker.' }, { status: 500 });
    }

    return NextResponse.json({ worker, temporaryPassword });
  } catch (caught) {
    if (caught instanceof Prisma.PrismaClientKnownRequestError) {
      if (caught.code === 'P2002') {
        return NextResponse.json({ error: 'Email is already in use.' }, { status: 409 });
      }
    }

    console.error(caught);
    return NextResponse.json({ error: 'Failed to create worker.' }, { status: 500 });
  }
}
