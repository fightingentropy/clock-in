import { withAuth } from 'next-auth/middleware';

import { LOGIN_ROUTE } from '@/lib/routes';

export default withAuth({
  pages: {
    signIn: LOGIN_ROUTE,
  },
});

export const config = {
  matcher: [
    '/((?!api/auth|login|manifest(?:\\.webmanifest|\\.json)?|favicon\\.ico|service-worker\\.js|_next|.*\\..*).*)',
  ],
};
