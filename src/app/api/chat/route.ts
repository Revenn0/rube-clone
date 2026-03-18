import { createGateway } from 'ai';
import {
  streamText,
  stepCountIs,
  convertToModelMessages,
  generateId,
  tool,
  jsonSchema,
  type UIMessage,
} from 'ai';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { getOrCreateUser } from '@/lib/auth';
import { Composio } from '@composio/core';
import { VercelProvider } from '@composio/vercel';

export const maxDuration = 30;

const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
  provider: new VercelProvider(),
});

export const AVAILABLE_MODELS = [
  'zai/glm-5-turbo',
  'openai/gpt-5.4',
  'anthropic/claude-sonnet-4.6',
  'xai/grok-4.20-non-reasoning-beta',
] as const;

const DEFAULT_MODEL =
  process.env.AI_GATEWAY_DEFAULT_MODEL || 'openai/gpt-5.4';

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
      const workflow = await prisma.workflow.create({
        data: {
          userId: user.id,
          name,
          description: prompt,
          apps: [],
          trigger: { type: 'schedule', cron: cronExpr, time: time || '09:00' },
          actions: [{ type: 'chat', prompt }],
          status: 'active',
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
    return new Response('Unauthorized', { status: 401 });
  }

  if (!process.env.COMPOSIO_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'COMPOSIO_API_KEY not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const body = await req.json();
  const { messages, sessionId: bodySessionId, id: bodyId, model: bodyModel } = body as {
    messages: UIMessage[];
    sessionId?: string;
    id?: string;
    model?: string;
  };
  const sessionId = bodySessionId ?? bodyId;
  const modelToUse = bodyModel && AVAILABLE_MODELS.includes(bodyModel as (typeof AVAILABLE_MODELS)[number])
    ? (bodyModel as (typeof AVAILABLE_MODELS)[number])
    : DEFAULT_MODEL;

  if (!messages || !Array.isArray(messages)) {
    return new Response(
      JSON.stringify({ error: 'messages array required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const session = await composio.create(userId);
  const composioTools = await session.tools();
  const tools = {
    ...composioTools,
    create_schedule: createScheduleTool,
  };

  const result = streamText({
    model: gateway(modelToUse),
    system: `You are Rube, an AI assistant. You have access to apps via Composio tools.
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

      const user = await getOrCreateUser();
      if (!user) return;

      const session = await prisma.chatSession.findFirst({
        where: { id: sessionId, userId: user.id },
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
