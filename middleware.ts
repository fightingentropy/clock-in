import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';

import { ADMIN_ROUTE, HOME_ROUTE, LOGIN_ROUTE, WORKER_ROUTE } from '@/lib/routes';

export default withAuth(
  (req) => {
    const token = req.nextauth.token;

    if (!token) {
      return NextResponse.next();
    }

    const pathname = req.nextUrl.pathname;
    const role = typeof token.role === 'string' ? token.role : undefined;
    const isAdmin = role === 'ADMIN';
    const isWorker = role === 'WORKER';
    const isInAdminSection = pathname === ADMIN_ROUTE || pathname.startsWith(`${ADMIN_ROUTE}/`);
    const isInWorkerSection = pathname === WORKER_ROUTE || pathname.startsWith(`${WORKER_ROUTE}/`);

    if (pathname === LOGIN_ROUTE) {
      if (isAdmin) {
        return NextResponse.redirect(new URL(ADMIN_ROUTE, req.url));
      }

      if (isWorker) {
        return NextResponse.redirect(new URL(WORKER_ROUTE, req.url));
      }

      return NextResponse.next();
    }

    if (pathname === HOME_ROUTE) {
      if (isAdmin) {
        return NextResponse.redirect(new URL(ADMIN_ROUTE, req.url));
      }

      if (isWorker) {
        return NextResponse.redirect(new URL(WORKER_ROUTE, req.url));
      }

      return NextResponse.next();
    }

    if (isInAdminSection && !isAdmin) {
      if (isWorker) {
        return NextResponse.redirect(new URL(WORKER_ROUTE, req.url));
      }

      return NextResponse.redirect(new URL(LOGIN_ROUTE, req.url));
    }

    if (isInWorkerSection && !isWorker) {
      if (isAdmin) {
        return NextResponse.redirect(new URL(ADMIN_ROUTE, req.url));
      }

      return NextResponse.redirect(new URL(LOGIN_ROUTE, req.url));
    }

    return NextResponse.next();
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
