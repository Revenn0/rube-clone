import { createGateway } from 'ai';
import { generateText } from 'ai';
import { Composio } from '@composio/core';
import { VercelProvider } from '@composio/vercel';
import { prisma } from '@/lib/db';

const COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY;
const COMPOSIO_MCP_URL = process.env.COMPOSIO_MCP_URL;

const gateway = createGateway({ apiKey: process.env.AI_GATEWAY_API_KEY });
const composio = new Composio({
  apiKey: COMPOSIO_API_KEY!,
  provider: new VercelProvider(),
});

const DEFAULT_MODEL = 'anthropic/claude-sonnet-4.6';

async function mcpCall(name: string, args: Record<string, unknown>) {
  if (!COMPOSIO_MCP_URL) return null;
  try {
    const res = await fetch(COMPOSIO_MCP_URL, {
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
  } catch (err) {
    console.error('mcpCall error:', err);
    return null;
  }
}

/** Compute next run time from cron expression (min hour day month weekday) */
function getNextRunFromCron(cronExpr: string): Date {
  const parts = cronExpr.split(/\s+/);
  const minute = parseInt(parts[0], 10) || 0;
  const hour = parseInt(parts[1], 10) || 9;
  const dayOfMonth = parts[2] === '*' ? '*' : parseInt(parts[2], 10);
  const month = parts[3] === '*' ? '*' : parseInt(parts[3], 10);
  const dayOfWeek = parts[4] === '*' ? '*' : parseInt(parts[4], 10);

  const now = new Date();
  const next = new Date(now);
  next.setMinutes(minute, 0, 0);
  next.setHours(hour);

  if (dayOfMonth !== '*' && month !== '*') {
    next.setDate(dayOfMonth);
    next.setMonth(month - 1);
    if (next <= now) next.setFullYear(next.getFullYear() + 1);
  } else if (dayOfMonth !== '*') {
    next.setDate(dayOfMonth);
    if (next <= now) next.setMonth(next.getMonth() + 1);
  } else if (dayOfWeek !== '*') {
    const targetDow = dayOfWeek === 0 ? 7 : dayOfWeek;
    const currentDow = next.getDay() || 7;
    let daysToAdd = targetDow - currentDow;
    if (daysToAdd <= 0) daysToAdd += 7;
    next.setDate(next.getDate() + daysToAdd);
    if (next <= now) next.setDate(next.getDate() + 7);
  } else {
    if (next <= now) next.setDate(next.getDate() + 1);
  }

  return next;
}

/** Execute a chat-type action: run AI with prompt and Composio tools */
async function executeChatAction(clerkUserId: string, prompt: string): Promise<void> {
  const session = await composio.create(clerkUserId);
  const tools = await session.tools();

  await generateText({
    model: gateway(DEFAULT_MODEL),
    system: `You are Jungor, an AI assistant. Execute the user's task using the available tools. Be concise.`,
    messages: [{ role: 'user' as const, content: prompt }],
    tools,
  });
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
  const clerkUserId = workflow.user.clerkId;

  try {
    const actions = workflow.actions as Array<
      | { type: 'chat'; prompt: string }
      | { app: string; action: string; params?: Record<string, unknown> }
    >;

    for (const action of actions) {
      if ('type' in action && action.type === 'chat') {
        await executeChatAction(clerkUserId, action.prompt);
      } else if ('app' in action && action.app) {
        const conn = await prisma.appConnection.findUnique({
          where: { userId_appId: { userId: workflow.userId, appId: action.app } },
        });

        if (!conn || conn.status !== 'active') {
          throw new Error(`${action.app} not connected`);
        }

        await mcpCall('COMPOSIO_MULTI_EXECUTE_TOOL', {
          tools: [{ tool_slug: action.action, arguments: action.params || {} }],
          session_id: clerkUserId,
        });
      }
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

    const trigger = wf.trigger as { type?: string; value?: string; cron?: string };
    const cronExpr = trigger.cron ?? trigger.value;

    if (cronExpr) {
      const next = getNextRunFromCron(cronExpr);
      await prisma.workflow.update({ where: { id: wf.id }, data: { nextRunAt: next } });
    }
  }

  return count;
}

export { getNextRunFromCron };
