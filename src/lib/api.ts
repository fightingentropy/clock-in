import { Role } from '@prisma/client';
import { NextResponse } from 'next/server';

import { getAuthSession } from './session';

export async function enforceAuth(allowedRoles?: Role | Role[]) {
  const session = await getAuthSession();

  if (!session?.user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      session: null,
    } as const;
  }

  if (allowedRoles) {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (!roles.includes(session.user.role as Role)) {
      return {
        error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
        session,
      } as const;
    }
  }

  return { session } as const;
}
