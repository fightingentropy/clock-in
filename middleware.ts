import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';

import { ADMIN_ROUTE, LOGIN_ROUTE, WORKER_ROUTE } from '@/lib/routes';

export default withAuth(
  (req) => {
    const token = req.nextauth.token;

    if (req.nextUrl.pathname === LOGIN_ROUTE && token) {
      const role = typeof token.role === 'string' ? token.role : undefined;
      const destination = role === 'ADMIN' ? ADMIN_ROUTE : WORKER_ROUTE;

      return NextResponse.redirect(new URL(destination, req.url));
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
