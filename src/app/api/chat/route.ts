import { openrouter } from '@openrouter/ai-sdk-provider';
import { Composio } from '@composio/core';
import { VercelProvider } from '@composio/vercel';
import { streamText, stepCountIs } from 'ai';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export const maxDuration = 60;

const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
  provider: new VercelProvider(),
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(req: Request) {
  const { userId } = await auth();
  const { messages, sessionId } = await req.json();

  let composioUserId = 'anonymous';
  if (userId) {
    let user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) user = await prisma.user.create({ data: { clerkId: userId, email: '' } });
    composioUserId = `user_${user.id}`;

    if (sessionId) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === 'user') {
        await prisma.chatMessage.create({ data: { sessionId, role: 'user', content: lastMsg.content } });
        await prisma.chatSession.update({ where: { id: sessionId }, data: { messageCount: { increment: 1 }, updatedAt: new Date() } });
      }
    }
  }

  // Create session with callback URL for in-chat auth
  const session = await composio.create(composioUserId, {
    manageConnections: {
      callbackUrl: `${APP_URL}/chat`,
    },
  });

  const tools = await session.tools();

  const result = streamText({
    model: openrouter('nvidia/nemotron-3-super-120b-a12b:free'),
    system: `You are Rube, a helpful AI assistant powered by Composio.

You have access to 1000+ apps: Gmail, Slack, GitHub, Notion, Google Calendar, Linear, Discord, Twitter/X, and more.

When a user asks to do something:
1. Search for the right tool using COMPOSIO_SEARCH_TOOLS
2. If the app needs authentication, COMPOSIO_MANAGE_CONNECTIONS will return a URL - share it
3. Once connected, execute the action

Be concise. Guide users through connecting apps when needed.`,
    messages,
    tools,
    stopWhen: stepCountIs(10),
  });

  return result.toTextStreamResponse();
}

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  if (!sessionId) return Response.json({ messages: [] });
  const msgs = await prisma.chatMessage.findMany({ where: { sessionId }, orderBy: { createdAt: 'asc' }, take: 100 });
  return Response.json({ messages: msgs });
}
