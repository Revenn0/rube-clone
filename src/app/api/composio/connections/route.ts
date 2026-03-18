import { NextResponse } from 'next/server';
import { Composio } from '@composio/core';
import { getOrCreateUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { APPS } from '@/lib/apps';

const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
});

// Map our app IDs to Composio toolkit slugs
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

// Map Composio slug back to our app id
const TOOLKIT_TO_APP: Record<string, string> = Object.fromEntries(
  Object.entries(APP_TO_TOOLKIT).map(([k, v]) => [v, k])
);

export const dynamic = 'force-dynamic';

// GET - List toolkits with connection status (merged with our APPS)
export async function GET() {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ toolkits: [], connections: [] });
  }

  try {
    const session = await composio.create(user.clerkId);
    const { items } = await session.toolkits({ limit: 100 });

    const toolkitsFromComposio = items
      .filter((t) => !t.isNoAuth)
      .map((t) => ({
        slug: t.slug,
        appId: TOOLKIT_TO_APP[t.slug] ?? t.slug,
        name: t.name,
        logo: t.logo,
        isConnected: t.connection?.isActive ?? false,
        connectedAccountId: t.connection?.connectedAccount?.id,
      }));

    // Merge with our APPS - use Composio status when available, else fallback to AppConnection
    const connections = await prisma.appConnection.findMany({
      where: { userId: user.id },
    });

    const composioStatus = new Map(
      toolkitsFromComposio.map((t) => [
        t.appId,
        { isConnected: t.isConnected, connectedAccountId: t.connectedAccountId },
      ])
    );

    const merged = APPS.map((app) => {
      const fromComposio = composioStatus.get(app.id);
      const fromDb = connections.find((c) => c.appId === app.id);
      const isConnected = fromComposio?.isConnected ?? fromDb?.status === 'active';
      const connectedAccountId =
        fromComposio?.connectedAccountId ?? (fromDb?.composioId as string | undefined);
      return {
        ...app,
        slug: APP_TO_TOOLKIT[app.id] ?? app.id,
        isConnected,
        connectedAccountId,
      };
    });

    return NextResponse.json({
      toolkits: merged,
      connections: connections.map((c) => ({
        appId: c.appId,
        status: c.status,
        connectedAt: c.connectedAt,
      })),
    });
  } catch (err) {
    console.error('Composio connections error:', err);
    return NextResponse.json({
      toolkits: APPS.map((a) => ({ ...a, isConnected: false })),
      connections: [],
    });
  }
}

// POST - Start OAuth for a toolkit
export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { toolkit }: { toolkit: string } = await req.json();
  if (!toolkit) {
    return NextResponse.json({ error: 'toolkit required' }, { status: 400 });
  }

  // Accept any toolkit slug: use mapping when in APP_TO_TOOLKIT, otherwise use slug directly
  const composioSlug = APP_TO_TOOLKIT[toolkit] ?? toolkit;
  const appIdForDb = APP_TO_TOOLKIT[toolkit] ? toolkit : composioSlug;
  const origin = new URL(req.url).origin;
  const callbackUrl = `${origin}/api/composio/callback?appId=${appIdForDb}&userId=${user.id}`;

  try {
    const session = await composio.create(user.clerkId);
    const connectionRequest = await session.authorize(composioSlug, {
      callbackUrl,
    });

    await prisma.appConnection.upsert({
      where: { userId_appId: { userId: user.id, appId: appIdForDb } },
      update: { status: 'connecting' },
      create: { userId: user.id, appId: appIdForDb, status: 'connecting' },
    });

    const redirectUrl =
      (connectionRequest as { redirectUrl?: string }).redirectUrl ??
      (connectionRequest as { redirect_url?: string }).redirect_url;

    return NextResponse.json({
      redirectUrl: redirectUrl ?? '',
    });
  } catch (err) {
    console.error('Composio authorize error:', err);
    return NextResponse.json(
      { error: 'Failed to get connection URL' },
      { status: 500 }
    );
  }
}
