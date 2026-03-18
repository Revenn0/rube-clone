import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

// Auto-create user if doesn't exist (usa upsert para evitar race e unique constraint)
export async function getOrCreateUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const clerkUser = await currentUser();
  const email =
    clerkUser?.emailAddresses?.[0]?.emailAddress || `${userId}@clerk.user`;
  const name =
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') ||
    null;

  return prisma.user.upsert({
    where: { clerkId: userId },
    update: { email, name, imageUrl: clerkUser?.imageUrl ?? undefined },
    create: {
      clerkId: userId,
      email,
      name,
      imageUrl: clerkUser?.imageUrl,
    },
  });
}

// Call in protected pages
export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  return getOrCreateUser();
}
