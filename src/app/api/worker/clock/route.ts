import { Role } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { distanceInMeters } from '@/lib/geoutils';
import { prisma } from '@/lib/prisma';
import { enforceAuth } from '@/lib/api';

const bodySchema = z.object({
  action: z.enum(['IN', 'OUT']),
  workplaceId: z.string(),
  latitude: z.number(),
  longitude: z.number(),
});

export async function POST(request: Request) {
  const { session, error } = await enforceAuth(Role.WORKER);

  if (!session) {
    return error;
  }

  const json = await request.json().catch(() => null);

  const parsed = bodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
  }

  const { action, workplaceId, latitude, longitude } = parsed.data;

  const assignment = await prisma.assignment.findFirst({
    where: { userId: session.user.id, workplaceId },
    include: { workplace: true },
  });

  if (!assignment) {
    return NextResponse.json({ error: 'You are not assigned to this workplace.' }, { status: 403 });
  }

  const workplace = assignment.workplace;
  const distance = distanceInMeters(
    { latitude, longitude },
    { latitude: workplace.latitude, longitude: workplace.longitude }
  );

  if (distance > workplace.radiusMeters) {
    return NextResponse.json(
      {
        error: `You must be within ${workplace.radiusMeters} meters to clock ${action === 'IN' ? 'in' : 'out'}.`,
        distance,
      },
      { status: 403 }
    );
  }

  if (action === 'IN') {
    const existing = await prisma.timeEntry.findFirst({
      where: { userId: session.user.id, clockOutAt: null },
    });

    if (existing) {
      return NextResponse.json({ error: 'You are already clocked in.' }, { status: 409 });
    }

    const entry = await prisma.timeEntry.create({
      data: {
        userId: session.user.id,
        workplaceId,
        clockInLat: latitude,
        clockInLng: longitude,
      },
      include: { workplace: true },
    });

    return NextResponse.json({ entry, distance });
  }

  const activeEntry = await prisma.timeEntry.findFirst({
    where: { userId: session.user.id, clockOutAt: null },
    include: { workplace: true },
    orderBy: { clockInAt: 'desc' },
  });

  if (!activeEntry) {
    return NextResponse.json({ error: 'No active shift found.' }, { status: 409 });
  }

  if (activeEntry.workplaceId !== workplaceId) {
    return NextResponse.json({ error: 'Active shift belongs to a different workplace.' }, { status: 409 });
  }

  const updated = await prisma.timeEntry.update({
    where: { id: activeEntry.id },
    data: {
      clockOutAt: new Date(),
      clockOutLat: latitude,
      clockOutLng: longitude,
    },
    include: { workplace: true },
  });

  return NextResponse.json({ entry: updated, distance });
}
