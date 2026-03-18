import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

// GET /api/sessions - List user's chat sessions
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ sessions: [] });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ sessions: [] });

  const sessions = await prisma.chatSession.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    take: 50,
    include: { _count: { select: { messages: true } } },
  });

  return NextResponse.json({ sessions });
}

// POST /api/sessions - Create new session
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    user = await prisma.user.create({ data: { clerkId: userId, email: '' } });
  }

  const { title, projectId } = await req.json();

  const session = await prisma.chatSession.create({
    data: {
      userId: user.id,
      title: title || 'New chat',
      projectId: projectId || 'general',
    },
  });

  return NextResponse.json({ session });
}

// DELETE /api/sessions?id=xxx
export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  await prisma.chatSession.deleteMany({ where: { id, userId: user.id } });

  return NextResponse.json({ success: true });
}
