import { createGateway } from 'ai';
import {
  streamText,
  stepCountIs,
  convertToModelMessages,
  generateId,
  tool,
  jsonSchema,
  isToolUIPart,
  getToolName,
  type UIMessage,
} from 'ai';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { getOrCreateUser } from '@/lib/auth';
import { Composio } from '@composio/core';
import { VercelProvider } from '@composio/vercel';
import { getNextRunFromCron } from '@/lib/workflow-engine';
import { checkUsageLimit, recordToolExecution } from '@/lib/usage';

export const maxDuration = 30;

const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
  provider: new VercelProvider(),
});

const CHAT_MODEL = 'anthropic/claude-sonnet-4.6';

function extractTextFromParts(parts: UIMessage['parts']): string {
  return parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('');
}

const createScheduleTool = tool({
  description: `Create a scheduled task that runs automatically. Use this when the user asks to schedule something, e.g. "Schedule it", "agende isso", "run every day at 9am", "todos os dias às 9h".
Extract from the conversation: (1) name - short title for the task, (2) prompt - the full task/instruction to run (e.g. "Read my emails and put them in Notion"), (3) schedule - "daily", "weekly", or "monthly", (4) time - 24h format like "09:00" or "14:30".
If the user just saved a Recipe or discussed a workflow, use that as the prompt. Default to daily at 09:00 if not specified.`,
  inputSchema: jsonSchema<{
    name: string;
    prompt: string;
    schedule?: 'daily' | 'weekly' | 'monthly';
    time?: string;
  }>({
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Short name for the scheduled task (e.g. "Email Summary")' },
      prompt: { type: 'string', description: 'The full task instruction to run (e.g. "Read my emails and categorize them in Notion")' },
      schedule: { type: 'string', enum: ['daily', 'weekly', 'monthly'], description: 'How often to run. Default: daily' },
      time: { type: 'string', description: 'Time in 24h format HH:mm (e.g. "09:00"). Default: 09:00' },
    },
    required: ['name', 'prompt'],
    additionalProperties: false,
  }),
  execute: async ({ name, prompt, schedule = 'daily', time = '09:00' }) => {
    const user = await getOrCreateUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const hour = parseInt((time || '09:00').split(':')[0], 10) || 9;
    const cronExpr =
      schedule === 'daily'
        ? `0 ${hour} * * *`
        : schedule === 'weekly'
          ? `0 ${hour} * * 1`
          : schedule === 'monthly'
            ? `0 ${hour} 1 * *`
            : `0 ${hour} * * *`;

    try {
      const nextRunAt = getNextRunFromCron(cronExpr);
      const workflow = await prisma.workflow.create({
        data: {
          userId: user.id,
          name,
          description: prompt,
          apps: [],
          trigger: { type: 'schedule', cron: cronExpr, time: time || '09:00' },
          actions: [{ type: 'chat', prompt }],
          status: 'active',
          nextRunAt,
        },
      });
      return {
        success: true,
        taskId: workflow.id,
        name: workflow.name,
        schedule,
        time: time || '09:00',
        message: `Scheduled "${name}" to run ${schedule} at ${time}. You can view it in Schedule.`,
      };
    } catch (err) {
      console.error('Create schedule error:', err);
      return { success: false, error: String(err) };
    }
  },
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response('Unauthorized. Please sign in.', {
      status: 401,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  if (!process.env.COMPOSIO_API_KEY) {
    return new Response('Service configuration error. Please try again later.', {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return new Response('Invalid request. Please try again.', {
      status: 400,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
  const { messages, sessionId: bodySessionId, id: bodyId } = body as {
    messages: UIMessage[];
    sessionId?: string;
    id?: string;
  };
  const sessionId = bodySessionId ?? bodyId;

  if (!messages || !Array.isArray(messages)) {
    return new Response('Invalid request. Messages are required.', {
      status: 400,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const user = await getOrCreateUser();
  if (!user) {
    return new Response('Unauthorized. Please sign in.', {
      status: 401,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  let usageCheck: { allowed: boolean; used: number; limit: number };
  try {
    usageCheck = await checkUsageLimit(user.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isPrismaError =
      message.includes('does not exist') ||
      message.includes('relation') ||
      message.includes('P2021') ||
      message.includes('P2018');
    console.error('Usage check error:', err);
    if (isPrismaError) {
      return new Response(
        'Database schema may be outdated. Run: npx prisma migrate deploy',
        { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
      );
    }
    return new Response('Service temporarily unavailable. Please try again.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  if (!usageCheck.allowed) {
    const msg = `Usage limit reached. You have used ${usageCheck.used} of ${usageCheck.limit} executions this month. Upgrade your plan in Settings to continue.`;
    return new Response(msg, {
      status: 402,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  try {
    const session = await composio.create(userId);

    let composioTools: Awaited<ReturnType<typeof session.tools>> | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const t = await session.tools();
        const n = t && typeof t === 'object' ? Object.keys(t as object).length : 0;
        if (n > 0) {
          composioTools = t;
          break;
        }
        console.warn(`[chat] session.tools() empty (attempt ${attempt + 1})`);
      } catch (e) {
        console.warn(`[chat] session.tools() failed (attempt ${attempt + 1}):`, e);
      }
      if (attempt === 0) await new Promise((r) => setTimeout(r, 500));
    }

    if (!composioTools || Object.keys(composioTools as object).length === 0) {
      return new Response(
        'Tools are temporarily unavailable. Please check your Composio API key and try again in a moment.',
        {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        }
      );
    }

    const tools = {
      ...composioTools,
      create_schedule: createScheduleTool,
    };

    const result = streamText({
      model: gateway(CHAT_MODEL),
      system: `You are Jungor, an AI assistant. You have access to apps via Composio tools.
When a tool requires authentication and the user hasn't connected yet, use COMPOSIO_MANAGE_CONNECTIONS to get a Connect Link and share it with the user.
NEVER ask the user to type "connected" or "Google connected" after connecting. When the user says "Continue" or returns after connecting, automatically retry the task from the previous message. Resume and complete the task without asking for confirmation.
Be concise and helpful.

SCHEDULING: When the user asks to schedule something (e.g. "Schedule it", "agende isso", "run every day at 9am", "todos os dias às 9h", "Would you like to schedule it?"), use the create_schedule tool. Extract the task from the conversation context (e.g. the Recipe they just saved, or the workflow discussed). Use create_schedule with name, prompt, schedule (daily/weekly/monthly), and time (HH:mm).

When presenting structured data (lists, emails, etc.), format it as Markdown tables when appropriate. Use:
- | Column1 | Column2 | Column3 |
- |---------|---------|---------|
- | value1  | value2  | value3  |

For data that fits well in tables, prefer tables. For short lists or summaries, use bullet points.`,
      messages: await convertToModelMessages(messages, { tools }),
      tools,
      stopWhen: stepCountIs(10),
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      generateMessageId: () => generateId(),
      onFinish: async ({ messages: updatedMessages, responseMessage, isAborted }) => {
        if (isAborted || !sessionId) return;

        const finishUser = await getOrCreateUser();
        if (!finishUser) return;

        const toolParts = responseMessage.parts.filter(isToolUIPart);
        for (const part of toolParts) {
          await recordToolExecution(finishUser.id, getToolName(part), sessionId);
        }

        const session = await prisma.chatSession.findFirst({
          where: { id: sessionId, userId: finishUser.id },
        });
        if (!session) return;

        const lastUserMsg = [...updatedMessages].reverse().find((m) => m.role === 'user');
        const userContent = lastUserMsg ? extractTextFromParts(lastUserMsg.parts) : '';
        const assistantContent = extractTextFromParts(responseMessage.parts);

        try {
          await prisma.$transaction([
            prisma.chatMessage.create({
              data: {
                sessionId,
                role: 'user',
                content: userContent || '[No text]',
              },
            }),
            prisma.chatMessage.create({
              data: {
                sessionId,
                role: 'assistant',
                content: assistantContent || '[No response]',
                metadata: responseMessage.parts.length > 1 ? { partsCount: responseMessage.parts.length } : undefined,
              },
            }),
            prisma.chatSession.update({
              where: { id: sessionId },
              data: {
                messageCount: { increment: 2 },
                updatedAt: new Date(),
              },
            }),
          ]);
        } catch (err) {
          console.error('Chat persist error:', err);
        }
      },
    });
  } catch (err) {
    console.error('Chat stream error:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return new Response(msg, {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  if (!sessionId) return Response.json({ messages: [] });
  try {
    const msgs = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
    const messages: UIMessage[] = msgs.map((m) => ({
      id: m.id,
      role: m.role as 'user' | 'assistant' | 'system',
      parts: [{ type: 'text' as const, text: m.content }],
    }));
    return Response.json({ messages });
  } catch {
    return Response.json({ messages: [] });
  }
}
