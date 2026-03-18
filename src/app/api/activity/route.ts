import { NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ logs: [] });
  }

  try {
    const [auditLogs, recentSessions] = await Promise.all([
      prisma.auditLog.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.chatSession.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' },
        take: 20,
      }),
    ]);

    const logs = [
      ...auditLogs.map((a) => ({
        id: a.id,
        action: a.action,
        details: a.resource,
        createdAt: a.createdAt.toISOString(),
        credits: undefined,
      })),
      ...recentSessions.map((s) => ({
        id: `s-${s.id}`,
        action: s.title,
        details: 'Chat',
        createdAt: s.updatedAt.toISOString(),
        credits: undefined,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 50);

    return NextResponse.json({ logs });
  } catch (err) {
    console.error('Activity logs error:', err);
    return NextResponse.json({ logs: [] });
  }
}
