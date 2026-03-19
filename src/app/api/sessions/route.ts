import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { getOrCreateUser } from '@/lib/auth';

// GET /api/sessions - List user's chat sessions (optional ?projectId=xxx)
export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ sessions: [] });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ sessions: [] });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');

  const sessions = await prisma.chatSession.findMany({
    where: {
      userId: user.id,
      ...(projectId === 'general'
        ? { projectId: null }
        : projectId
        ? { projectId }
        : {}),
    },
    orderBy: { updatedAt: 'desc' },
    take: 50,
    include: { _count: { select: { messages: true } } },
  });

  return NextResponse.json({ sessions });
}

// POST /api/sessions - Create new session
export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { title?: string; projectId?: string } = {};
  try {
    body = (await req.json()) as { title?: string; projectId?: string };
  } catch {
    // body vazio ou JSON inválido
  }

  const { title, projectId } = body;
  const validProjectId = projectId && projectId !== 'general' ? projectId : null;

  const session = await prisma.chatSession.create({
    data: {
      user: { connect: { id: user.id } },
      title: title || 'New chat',
      ...(validProjectId
        ? { project: { connect: { id: validProjectId } } }
        : {}),
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