import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { authOptions } from './auth';
import { LOGIN_ROUTE, getDashboardRouteForRole, type AppUserRole } from './routes';

export const getAuthSession = () => getServerSession(authOptions);

export const requireAuthSession = async () => {
  const session = await getAuthSession();

  if (!session) {
    redirect(LOGIN_ROUTE);
  }

  return session;
};

export const requireRole = async (roles: AppUserRole | AppUserRole[]) => {
  const session = await requireAuthSession();
  const allowed = Array.isArray(roles) ? roles : [roles];

  if (!allowed.includes(session.user.role as AppUserRole)) {
    redirect(getDashboardRouteForRole(session.user.role));
  }

  return session;
};
