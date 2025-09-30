import { Role } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { enforceAuth } from '@/lib/api';

const payloadSchema = z.object({
  name: z.string().min(2).optional(),
  latitude: z
    .number()
    .refine((value) => Math.abs(value) <= 90, 'Latitude must be between -90 and 90')
    .optional(),
  longitude: z
    .number()
    .refine((value) => Math.abs(value) <= 180, 'Longitude must be between -180 and 180')
    .optional(),
  radiusMeters: z.number().min(10).max(1000).optional(),
  address: z.string().optional().or(z.literal('')),
});

const requestSchema = payloadSchema.partial();

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { session, error } = await enforceAuth(Role.ADMIN);

  if (!session) {
    return error;
  }

  const { id } = await context.params;
  const json = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
  }

  const workplace = await prisma.workplace.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(workplace);
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const { session, error } = await enforceAuth(Role.ADMIN);

  if (!session) {
    return error;
  }

  const { id } = await context.params;

  await prisma.workplace.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
