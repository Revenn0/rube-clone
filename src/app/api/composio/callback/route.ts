import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY;
const COMPOSIO_BASE = 'https://backend.composio.dev/api/v2';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// GET /api/composio/callback - OAuth callback from Composio
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const appId = searchParams.get('appId');
  const userId = searchParams.get('userId');
  const status = searchParams.get('status');
  const connectionId = searchParams.get('connectionId');

  if (!appId || !userId) {
    return NextResponse.redirect(`${APP_URL}/settings?error=missing_params`);
  }

  if (status === 'success' || connectionId) {
    // Update connection status
    await prisma.appConnection.upsert({
      where: {
        userId_appId: { userId, appId },
      },
      update: {
        status: 'active',
        composioId: connectionId,
        connectedAt: new Date(),
      },
      create: {
        userId,
        appId,
        composioId: connectionId,
        status: 'active',
        connectedAt: new Date(),
      },
    });

    // Log audit
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'app.connected',
          resource: appId,
          details: { connectionId },
        },
      });
    }

    return NextResponse.redirect(`${APP_URL}/chat?connected=${appId}`);
  }

  return NextResponse.redirect(`${APP_URL}/settings?error=connection_failed`);
}
