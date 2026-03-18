import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import fs from 'fs';

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    server: 'up',
    database: 'unknown' as string,
    stats: {} as Record<string, number>,
    recentLogs: [] as string[],
  };

  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'connected';

    // Get stats
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

  // Get recent health logs
  try {
    const logFile = '/root/rube-clone/logs/health.log';
    if (fs.existsSync(logFile)) {
      const logs = fs.readFileSync(logFile, 'utf-8');
      const lines = logs.trim().split('\n').slice(-20);
      checks.recentLogs = lines;
    }
  } catch {}

  return NextResponse.json(checks);
}
