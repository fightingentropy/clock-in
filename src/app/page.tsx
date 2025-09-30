import { redirect } from 'next/navigation';

import { ADMIN_ROUTE, LOGIN_ROUTE, WORKER_ROUTE } from '@/lib/routes';
import { getAuthSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getAuthSession();

  if (!session) {
    redirect(LOGIN_ROUTE);
  }

  if (session.user.role === 'ADMIN') {
    redirect(ADMIN_ROUTE);
  }

  redirect(WORKER_ROUTE);
}
