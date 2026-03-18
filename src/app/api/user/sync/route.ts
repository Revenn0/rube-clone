import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

// POST /api/user/sync - Sync Clerk user to our database
export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress || '';
  const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null;
  const imageUrl = clerkUser.imageUrl;

  // Upsert user
  const user = await prisma.user.upsert({
    where: { clerkId: userId },
    update: {
      email,
      name,
      imageUrl,
    },
    create: {
      clerkId: userId,
      email,
      name,
      imageUrl,
    },
  });

  return NextResponse.json({ user });
}
