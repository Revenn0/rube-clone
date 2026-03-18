import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/composio/callback — OAuth callback from Composio
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const appId = searchParams.get('appId');
  const userId = searchParams.get('userId');
  const status = searchParams.get('status');
  const connected = searchParams.get('connected');

  if (appId && userId) {
    // Update connection status in DB
    try {
      await prisma.appConnection.upsert({
        where: { userId_appId: { userId, appId } },
        update: {
          status: status === 'success' || connected === 'true' ? 'active' : 'error',
          connectedAt: new Date(),
        },
        create: {
          userId,
          appId,
          status: 'active',
          connectedAt: new Date(),
        },
      });
    } catch (err) {
      console.error('Callback error:', err);
    }
  }

  // Redirect back to chat
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return NextResponse.redirect(`${appUrl}/chat?connected=${appId || 'unknown'}`);
}
