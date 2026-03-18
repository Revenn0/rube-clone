import { prisma } from '@/lib/db';

const COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY;
const COMPOSIO_MCP_URL = process.env.COMPOSIO_MCP_URL;

async function mcpCall(name: string, args: Record<string, unknown>) {
  try {
    const res = await fetch(COMPOSIO_MCP_URL!, {
      method: 'POST',
      headers: {
        'x-api-key': COMPOSIO_API_KEY!,
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method: 'tools/call', params: { name, arguments: args } }),
    });
    const text = await res.text();
    for (const line of text.split('\n')) {
      if (line.startsWith('data: ')) return JSON.parse(line.slice(6));
    }
    return null;
  } catch (err) { console.error(err); return null; }
}

// Execute a workflow
export async function executeWorkflow(workflowId: string): Promise<void> {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    include: { user: true },
  });
  if (!workflow || workflow.status !== 'active') return;

  const exec = await prisma.workflowExecution.create({
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
    
    for (const action of actions) {
      const conn = await prisma.appConnection.findUnique({
        where: { userId_appId: { userId: workflow.userId, appId: action.app } },
      });

      if (!conn || conn.status !== 'active') {
        throw new Error(`${action.app} not connected`);
      }

      // Composio requires Clerk userId to scope tool execution to user's connections
      const clerkUserId = workflow.user.clerkId;

      await mcpCall('COMPOSIO_MULTI_EXECUTE_TOOL', {
        tools: [{ tool_slug: action.action, arguments: action.params || {} }],
        session_id: clerkUserId,
      });
    }

    await prisma.workflowExecution.update({
      where: { id: exec.id },
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
      where: { id: exec.id },
      data: {
        status: 'error',
        completedAt: new Date(),
        duration: Date.now() - startTime,
        error: err instanceof Error ? err.message : 'Unknown error',
      },
    });
  }
}

// Check and run due workflows
export async function runDueWorkflows(): Promise<number> {
  const now = new Date();
  let count = 0;

  const due = await prisma.workflow.findMany({
    where: { status: 'active', nextRunAt: { lte: now } },
  });

  for (const wf of due) {
    await executeWorkflow(wf.id);
    count++;

    const trigger = wf.trigger as { type: string; value?: string };
    if (trigger.type === 'cron' && trigger.value) {
      const parts = trigger.value.split(' ');
      const hour = parseInt(parts[1]) || 0;
      const minute = parseInt(parts[0]) || 0;
      const next = new Date();
      next.setHours(hour, minute, 0, 0);
      if (next <= now) next.setDate(next.getDate() + 1);
      await prisma.workflow.update({ where: { id: wf.id }, data: { nextRunAt: next } });
    }
  }

  return count;
}
