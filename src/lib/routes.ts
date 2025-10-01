/**
 * Central place for routes that need environment-specific handling.
 * Keep the login route relative so middleware + NextAuth redirects stay on the
 * current deployment's host (e.g. previews, dev tunnels).
 */
export const LOGIN_ROUTE = '/login';
export const HOME_ROUTE = '/';
export const ADMIN_ROUTE = '/admin';
export const WORKER_ROUTE = '/worker';

export type AppUserRole = 'ADMIN' | 'WORKER';

export const getDashboardRouteForRole = (
  role: string | null | undefined,
  fallback: string = HOME_ROUTE
) => {
  if (role === 'ADMIN') {
    return ADMIN_ROUTE;
  }

  if (role === 'WORKER') {
    return WORKER_ROUTE;
  }

  return fallback;
};
