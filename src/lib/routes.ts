const PRODUCTION_LOGIN_URL = 'https://clock-in-five.vercel.app/login';

/**
 * Central place for routes that need environment-specific handling.
 */
export const LOGIN_ROUTE =
  process.env.NODE_ENV === 'production' ? PRODUCTION_LOGIN_URL : '/login';
export const HOME_ROUTE = '/';
export const ADMIN_ROUTE = '/admin';
export const WORKER_ROUTE = '/worker';
