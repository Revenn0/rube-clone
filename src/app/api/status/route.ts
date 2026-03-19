import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    server: 'up',
    database: 'unknown' as string,
    stats: {} as Record<string, number>,
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'connected';

    const [users, sessions, messages, workflows, connections] = await Promise.all([
      prisma.user.count(),
      prisma.chatSession.count(),
      prisma.chatMessage.count(),
      prisma.workflow.count(),
      prisma.appConnection.count(),
    ]);

    checks.stats = { users, sessions, messages, workflows, connections };
  } catch {
    checks.database = 'error';
  }

  return NextResponse.json(checks);
}
