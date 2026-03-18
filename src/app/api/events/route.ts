import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

// SSE endpoint for real-time updates
export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return new Response('User not found', { status: 404 });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      // Send initial state
      const [workflows, sessions, connections] = await Promise.all([
        prisma.workflow.findMany({ where: { userId: user.id }, orderBy: { updatedAt: 'desc' }, take: 10 }),
        prisma.chatSession.findMany({ where: { userId: user.id }, orderBy: { updatedAt: 'desc' }, take: 5 }),
        prisma.appConnection.findMany({ where: { userId: user.id } }),
      ]);

      send('init', { workflows, sessions, connections, timestamp: new Date().toISOString() });

      // Poll for changes every 5 seconds
      const interval = setInterval(async () => {
        try {
          const [updatedWorkflows, updatedSessions] = await Promise.all([
            prisma.workflow.findMany({ where: { userId: user.id }, orderBy: { updatedAt: 'desc' }, take: 10 }),
            prisma.chatSession.findMany({ where: { userId: user.id }, orderBy: { updatedAt: 'desc' }, take: 5 }),
          ]);

          // Check for workflow executions
          const recentExecutions = await prisma.workflowExecution.findMany({
            where: {
              userId: user.id,
              startedAt: { gte: new Date(Date.now() - 10000) }, // Last 10 seconds
            },
            include: { workflow: { select: { name: true } } },
          });

          send('update', {
            workflows: updatedWorkflows,
            sessions: updatedSessions,
            executions: recentExecutions,
            timestamp: new Date().toISOString(),
          });

          if (recentExecutions.length > 0) {
            send('executions', recentExecutions);
          }
        } catch (err) {
          send('error', { message: 'Failed to fetch updates' });
        }
      }, 5000);

      // Cleanup on disconnect
      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
