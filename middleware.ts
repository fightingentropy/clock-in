import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/login',
  },
});

export const config = {
  matcher: ['/((?!api/auth|login|manifest\\.json|favicon\\.ico|service-worker\\.js|_next|.*\\..*).*)'],
};
