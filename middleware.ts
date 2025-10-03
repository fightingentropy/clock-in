import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';

import { ADMIN_ROUTE, HOME_ROUTE, LOGIN_ROUTE, WORKER_ROUTE, getDashboardRouteForRole } from '@/lib/routes';

export default withAuth(
  (req) => {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;
    const role = typeof token?.role === 'string' ? token.role : undefined;
    const dashboardRoute = getDashboardRouteForRole(role, '');
    const isAdmin = role === 'ADMIN';
    const isWorker = role === 'WORKER';
    const isInAdminSection = pathname === ADMIN_ROUTE || pathname.startsWith(`${ADMIN_ROUTE}/`);
    const isInWorkerSection = pathname === WORKER_ROUTE || pathname.startsWith(`${WORKER_ROUTE}/`);
    const shouldDisableCache = isInAdminSection || isInWorkerSection;

    const applyNoStore = <T extends NextResponse>(response: T) => {
      if (shouldDisableCache) {
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');
      }

      return response;
    };

    if (pathname === LOGIN_ROUTE) {
      if (dashboardRoute) {
        return applyNoStore(NextResponse.redirect(new URL(dashboardRoute, req.url)));
      }

      return applyNoStore(NextResponse.next());
    }

    if (pathname === HOME_ROUTE) {
      if (dashboardRoute) {
        return applyNoStore(NextResponse.redirect(new URL(dashboardRoute, req.url)));
      }

      return applyNoStore(NextResponse.next());
    }

    if (isInAdminSection && !isAdmin) {
      const fallback = dashboardRoute || LOGIN_ROUTE;
      return applyNoStore(NextResponse.redirect(new URL(fallback, req.url)));
    }

    if (isInWorkerSection && !isWorker) {
      const fallback = dashboardRoute || LOGIN_ROUTE;
      return applyNoStore(NextResponse.redirect(new URL(fallback, req.url)));
    }

    return applyNoStore(NextResponse.next());
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        if (req.nextUrl.pathname === LOGIN_ROUTE) {
          return true;
        }

        return !!token;
      },
    },
    pages: {
      signIn: LOGIN_ROUTE,
    },
  }
);

export const config = {
  matcher: [
    '/login',
    '/((?!api/auth|manifest(?:\\.webmanifest|\\.json)?|favicon\\.ico|service-worker\\.js|_next|.*\\..*).*)',
  ],
};
