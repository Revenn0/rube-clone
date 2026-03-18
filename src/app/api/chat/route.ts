import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText } from 'ai';
import { prisma } from '@/lib/db';

export const maxDuration = 30;

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(req: Request) {
  const { messages, sessionId } = await req.json();

  // Simple chat without Composio for now (gets stuck sometimes)
  const result = streamText({
    model: openrouter('nvidia/nemotron-3-super-120b-a12b:free'),
    system: `You are Rube, a helpful AI assistant. You can connect to apps like Gmail, Slack, GitHub, Notion, and more through Composio integrations.

When users ask about connecting apps or performing actions, guide them to the /apps page.
Be concise and helpful. Keep responses short.`,
    messages,
  });

  return result.toTextStreamResponse();
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
    return Response.json({ messages: msgs });
  } catch {
    return Response.json({ messages: [] });
  }
}
