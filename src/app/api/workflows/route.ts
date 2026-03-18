import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { executeWorkflow } from '@/lib/workflow-engine';

// GET /api/workflows
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ workflows: [] });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ workflows: [] });

  const workflows = await prisma.workflow.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      executions: { take: 1, orderBy: { startedAt: 'desc' } },
    },
  });

  return NextResponse.json({ workflows });
}

// POST /api/workflows
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) user = await prisma.user.create({ data: { clerkId: userId, email: '' } });

  const { name, description, apps, trigger, actions, autoDelete } = await req.json();

  let nextRunAt: Date | undefined;
  if (trigger?.type === 'cron' && trigger.value) {
    const parts = trigger.value.split(' ');
    const hour = parseInt(parts[1]) || 0;
    const minute = parseInt(parts[0]) || 0;
    const next = new Date();
    next.setHours(hour, minute, 0, 0);
    if (next <= new Date()) next.setDate(next.getDate() + 1);
    nextRunAt = next;
  }

  const workflow = await prisma.workflow.create({
    data: {
      userId: user.id,
      name,
      description,
      apps: apps || [],
      trigger,
      actions: actions || [],
      autoDelete: autoDelete || false,
      nextRunAt,
    },
  });

  return NextResponse.json({ workflow });
}

// PATCH /api/workflows
export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const { id, ...updates } = await req.json();

  await prisma.workflow.updateMany({
    where: { id, userId: user.id },
    data: updates,
  });

  return NextResponse.json({ success: true });
}

// DELETE /api/workflows?id=xxx
export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  await prisma.workflow.deleteMany({ where: { id, userId: user.id } });

  return NextResponse.json({ success: true });
}
