import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { LandingClient } from '@/components/landing/landing-client';

export default async function RootPage() {
  const { userId } = await auth();
  if (userId) redirect('/chat');

  return <LandingClient />;
}
