import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

// Auto-create user if doesn't exist
export async function getOrCreateUser() {
  const { userId } = await auth();
  if (!userId) return null;

  let user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    user = await prisma.user.create({
      data: { clerkId: userId, email: '' },
    });
  }
  return user;
}

// Call in protected pages
export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  return getOrCreateUser();
}
