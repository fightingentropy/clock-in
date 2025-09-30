import { redirect } from 'next/navigation';

import { ADMIN_ROUTE, WORKER_ROUTE } from '@/lib/routes';
import { getAuthSession } from '@/lib/session';

import { LoginForm } from './login-form';

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: 'Invalid credentials. Please try again.',
};

const isSafeRelativeUrl = (value: string) => value.startsWith('/') && !value.startsWith('//');

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getAuthSession();

  if (session) {
    const target = session.user.role === 'ADMIN' ? ADMIN_ROUTE : WORKER_ROUTE;
    redirect(target);
  }

  const params = searchParams ? await searchParams : undefined;

  const callbackParam = typeof params?.callbackUrl === 'string' ? params.callbackUrl : undefined;
  const callbackUrl = callbackParam && isSafeRelativeUrl(callbackParam) ? callbackParam : ADMIN_ROUTE;

  const email = typeof params?.email === 'string' ? params.email : '';
  const errorParam = typeof params?.error === 'string' ? params.error : undefined;
  const error = errorParam ? ERROR_MESSAGES[errorParam] ?? 'Something went wrong. Please try again.' : null;

  return <LoginForm defaultEmail={email} callbackUrl={callbackUrl} initialError={error} />;
}
