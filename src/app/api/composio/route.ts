import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

const COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY;
const COMPOSIO_BASE = 'https://backend.composio.dev/api/v2';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Map our app IDs to Composio app names
const APP_MAP: Record<string, string> = {
  gmail: 'gmail',
  google_sheets: 'google_sheets',
  google_calendar: 'googlecalendar',
  teams: 'microsoft_teams',
  slack: 'slack',
  github: 'github',
  notion: 'notion',
  linear: 'linear',
  discord: 'discord',
  twitter: 'twitter',
  resend: 'resend',
  airtable: 'airtable',
  stripe: 'stripe',
  youtube: 'youtube',
};

// POST /api/composio/connect - Initiate OAuth connection
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    // Create user on first connection
    user = await prisma.user.create({
      data: {
        clerkId: userId,
        email: '',
      },
    });
  }

  const { appId } = await req.json();
  const composioAppId = APP_MAP[appId] || appId;

  try {
    // Request connection URL from Composio
    const res = await fetch(`${COMPOSIO_BASE}/connectedAccounts/initiate`, {
      method: 'POST',
      headers: {
        'x-api-key': COMPOSIO_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        appName: composioAppId,
        redirectUrl: `${APP_URL}/api/composio/callback?appId=${appId}&userId=${user.id}`,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error('Composio error:', error);
      return NextResponse.json({
        url: `https://platform.composio.dev/connect/${composioAppId}`,
        demo: true,
      });
    }

    const data = await res.json();

    // Store pending connection
    await prisma.appConnection.upsert({
      where: {
        userId_appId: { userId: user.id, appId },
      },
      update: {
        status: 'connecting',
        composioId: data.connectionId,
      },
      create: {
        userId: user.id,
        appId,
        composioId: data.connectionId,
        status: 'connecting',
      },
    });

    return NextResponse.json({
      url: data.redirectUrl || data.url || data.connectionUrl,
      connectionId: data.connectionId,
    });
  } catch (err) {
    console.error('Composio connect error:', err);
    return NextResponse.json({
      url: `https://platform.composio.dev/connect/${composioAppId}`,
      demo: true,
    });
  }
}

// GET /api/composio - List connected apps
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    return NextResponse.json({ connections: [] });
  }

  const connections = await prisma.appConnection.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ connections });
}

// DELETE /api/composio?appId=xxx - Disconnect app
export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const appId = searchParams.get('appId');

  if (!appId) {
    return NextResponse.json({ error: 'appId required' }, { status: 400 });
  }

  await prisma.appConnection.deleteMany({
    where: { userId: user.id, appId },
  });

  return NextResponse.json({ success: true });
}
