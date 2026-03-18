import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/composio/callback — OAuth callback from Composio
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const appId = searchParams.get('appId');
  const userId = searchParams.get('userId');
  const status = searchParams.get('status');
  const connected = searchParams.get('connected');
  const connectedAccountId = searchParams.get('connected_account_id');

  const isSuccess = status === 'success' || connected === 'true';

  if (appId && userId) {
    try {
      await prisma.appConnection.upsert({
        where: { userId_appId: { userId, appId } },
        update: {
          status: isSuccess ? 'active' : 'error',
          connectedAt: isSuccess ? new Date() : undefined,
          composioId: connectedAccountId || undefined,
        },
        create: {
          userId,
          appId,
          status: isSuccess ? 'active' : 'error',
          connectedAt: isSuccess ? new Date() : undefined,
          composioId: connectedAccountId || undefined,
        },
      });
    } catch (err) {
      console.error('Callback error:', err);
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const sessionId = req.headers.get('cookie')?.match(/rube_pendingSession=([^;]+)/)?.[1];
  const chatUrl = sessionId
    ? `${appUrl}/chat?connected=${appId || 'unknown'}&session=${encodeURIComponent(sessionId)}`
    : `${appUrl}/chat?connected=${appId || 'unknown'}`;
  const res = NextResponse.redirect(chatUrl);
  res.headers.append('Set-Cookie', 'rube_pendingSession=; path=/; max-age=0');
  return res;
}
