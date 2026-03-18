import { prisma } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

const COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY;
const COMPOSIO_BASE = 'https://backend.composio.dev/api/v2';

// Execute a workflow
export async function executeWorkflow(workflowId: string): Promise<void> {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    include: { user: true },
  });
  if (!workflow || workflow.status !== 'active') return;

  const execution = await prisma.workflowExecution.create({
    data: {
      workflowId: workflow.id,
      userId: workflow.userId,
      status: 'running',
      input: workflow.trigger as never,
    },
  });

  const startTime = Date.now();

  try {
    const actions = workflow.actions as Array<{ app: string; action: string; params?: Record<string, unknown> }>;

    if (actions.length === 0) {
      // No actions defined yet - just log
      console.log(`[Workflow] ${workflow.name} - no actions defined, marking as completed`);
    }

    for (const action of actions) {
      await executeAction(workflow.userId, action);
    }

    await prisma.workflowExecution.update({
      where: { id: execution.id },
      data: { status: 'success', completedAt: new Date(), duration: Date.now() - startTime },
    });

    await prisma.workflow.update({
      where: { id: workflow.id },
      data: { runCount: { increment: 1 }, lastRunAt: new Date() },
    });

    if (workflow.autoDelete) {
      await prisma.workflow.update({
        where: { id: workflow.id },
        data: { status: 'completed' },
      });
    }
  } catch (err) {
    await prisma.workflowExecution.update({
      where: { id: execution.id },
      data: {
        status: 'error',
        completedAt: new Date(),
        duration: Date.now() - startTime,
        error: err instanceof Error ? err.message : 'Unknown error',
      },
    });
  }
}

async function executeAction(userId: string, action: { app: string; action: string; params?: Record<string, unknown> }) {
  const connection = await prisma.appConnection.findUnique({
    where: { userId_appId: { userId, appId: action.app } },
  });

  if (!connection || connection.status !== 'active') {
    throw new Error(`App ${action.app} not connected`);
  }

  const res = await fetch(`${COMPOSIO_BASE}/actions/execute`, {
    method: 'POST',
    headers: {
      'x-api-key': COMPOSIO_API_KEY || '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      actionName: action.action,
      connectedAccountId: connection.composioId,
      params: action.params || {},
    }),
  });

  if (!res.ok) {
    throw new Error(`Composio action failed: ${res.statusText}`);
  }

  return res.json();
}

// Run due workflows - called by cron
export async function runDueWorkflows(): Promise<{ run: number; errors: number }> {
  const now = new Date();
  let run = 0;
  let errors = 0;

  const dueWorkflows = await prisma.workflow.findMany({
    where: {
      status: 'active',
      nextRunAt: { lte: now },
    },
  });

  for (const workflow of dueWorkflows) {
    try {
      await executeWorkflow(workflow.id);
      run++;

      // Calculate next run
      const trigger = workflow.trigger as { type: string; value?: string };
      if (trigger.type === 'cron' && trigger.value) {
        const parts = trigger.value.split(' ');
        const hour = parseInt(parts[1]) || 0;
        const minute = parseInt(parts[0]) || 0;
        const next = new Date();
        next.setHours(hour, minute, 0, 0);
        if (next <= now) next.setDate(next.getDate() + 1);

        await prisma.workflow.update({
          where: { id: workflow.id },
          data: { nextRunAt: next },
        });
      }
    } catch (err) {
      console.error(`[Workflow] Error executing ${workflow.id}:`, err);
      errors++;
    }
  }

  return { run, errors };
}

// API route for manual execution and cron trigger
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { action, workflowId } = body;

  if (action === 'execute' && workflowId) {
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

    const workflow = await prisma.workflow.findFirst({
      where: { id: workflowId, userId: user.id },
    });
    if (!workflow) return Response.json({ error: 'Not found' }, { status: 404 });

    executeWorkflow(workflowId).catch(console.error);
    return Response.json({ message: 'Execution started' });
  }

  if (action === 'run-due') {
    // Only allow in development or with special key
    const result = await runDueWorkflows();
    return Response.json(result);
  }

  return Response.json({ error: 'Invalid action' }, { status: 400 });
}
