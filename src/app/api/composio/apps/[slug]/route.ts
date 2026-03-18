import { NextResponse } from 'next/server';
import { Composio } from '@composio/core';
import { getOrCreateUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { APPS, TOOL_COUNT } from '@/lib/apps';

const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
});

const APP_TO_TOOLKIT: Record<string, string> = {
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

// Common OAuth scopes per app (read-only fallback when Composio doesn't expose)
const APP_SCOPES: Record<string, string[]> = {
  gmail: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/userinfo.email',
  ],
  slack: ['channels:read', 'chat:write', 'users:read', 'channels:history'],
  github: ['repo', 'read:user', 'user:email'],
  notion: ['notion-api'],
  google_calendar: [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ],
  linear: ['read', 'write'],
  twitter: ['tweet.read', 'tweet.write', 'users.read'],
  stripe: ['read_write'],
  youtube: ['https://www.googleapis.com/auth/youtube.readonly'],
  discord: ['identify', 'guilds'],
  airtable: ['data.records:read', 'data.records:write'],
  resend: ['emails:send', 'emails:read'],
};

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await params;
  const appId = Object.keys(APP_TO_TOOLKIT).includes(slug)
    ? slug
    : Object.entries(APP_TO_TOOLKIT).find(([, v]) => v === slug)?.[0] ?? slug;

  const app = APPS.find((a) => a.id === appId);
  if (!app) {
    return NextResponse.json({ error: 'App not found' }, { status: 404 });
  }

  const composioSlug = APP_TO_TOOLKIT[appId] ?? appId;
  const toolCount = TOOL_COUNT[appId] ?? 0;
  const scopes = APP_SCOPES[appId] ?? [];

  try {
    const session = await composio.create(user.clerkId);
    const { items } = await session.toolkits({ limit: 100 });
    const toolkit = items.find((t) => t.slug === composioSlug);

    const isConnected = toolkit?.connection?.isActive ?? false;
    const connectedAccountId = toolkit?.connection?.connectedAccount?.id;

    const dbConnection = await prisma.appConnection.findFirst({
      where: { userId: user.id, appId },
    });

    const connectedAt =
      dbConnection?.connectedAt ?? (isConnected ? new Date().toISOString() : null);

    return NextResponse.json({
      app: {
        id: app.id,
        name: app.name,
        description: app.description,
        category: app.category,
        composioSlug,
      },
      connection: {
        isConnected,
        connectedAccountId,
        connectedAt,
      },
      toolCount,
      scopes,
      composioVerified: true,
    });
  } catch (err) {
    console.error('Composio app detail error:', err);
    return NextResponse.json({
      app: {
        id: app.id,
        name: app.name,
        description: app.description,
        category: app.category,
        composioSlug,
      },
      connection: { isConnected: false, connectedAccountId: null, connectedAt: null },
      toolCount,
      scopes,
      composioVerified: true,
    });
  }
}
