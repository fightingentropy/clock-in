import { redirect } from 'next/navigation';

import { getAuthSession } from '@/lib/session';

export default async function Home() {
  const session = await getAuthSession();

  if (!session) {
    redirect('/login');
  }

  if (session.user.role === 'ADMIN') {
    redirect('/admin');
  }

  redirect('/worker');
}
