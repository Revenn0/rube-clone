import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { executeWorkflow } from '@/lib/workflow-engine';

// POST /api/executions - Execute a workflow manually
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const { workflowId } = await req.json();

  // Verify ownership
  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, userId: user.id },
  });

  if (!workflow) {
    return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
  }

  // Execute asynchronously
  executeWorkflow(workflowId).catch(console.error);

  return NextResponse.json({ message: 'Execution started' });
}

// GET /api/executions?workflowId=xxx - List executions
export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    return NextResponse.json({ executions: [] });
  }

  const { searchParams } = new URL(req.url);
  const workflowId = searchParams.get('workflowId');

  const executions = await prisma.workflowExecution.findMany({
    where: {
      userId: user.id,
      ...(workflowId ? { workflowId } : {}),
    },
    orderBy: { startedAt: 'desc' },
    take: 50,
    include: {
      workflow: { select: { name: true } },
    },
  });

  return NextResponse.json({ executions });
}
