import { redirect } from 'next/navigation';

import { HOME_ROUTE, LOGIN_ROUTE, getDashboardRouteForRole } from '@/lib/routes';
import { getAuthSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getAuthSession();

  if (!session) {
    redirect(LOGIN_ROUTE);
  }

  const destination = getDashboardRouteForRole(session.user.role, HOME_ROUTE);

  if (destination === HOME_ROUTE) {
    redirect(LOGIN_ROUTE);
  }

  redirect(destination);
}
