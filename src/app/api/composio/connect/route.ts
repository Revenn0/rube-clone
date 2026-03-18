import { NextResponse } from 'next/server';

const COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY;
const COMPOSIO_BASE = 'https://backend.composio.dev/api/v2';

// Map our app IDs to Composio app IDs
const APP_ID_MAP: Record<string, string> = {
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
};

export async function POST(req: Request) {
  const { appId } = await req.json();

  if (!appId) {
    return NextResponse.json({ error: 'appId required' }, { status: 400 });
  }

  const composioAppId = APP_ID_MAP[appId] || appId;

  try {
    // Request a connection URL from Composio
    const res = await fetch(`${COMPOSIO_BASE}/connectedAccounts/initiate`, {
      method: 'POST',
      headers: {
        'x-api-key': COMPOSIO_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        appName: composioAppId,
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?connected=${appId}`,
      }),
    });

    if (!res.ok) {
      // For demo, return a fake URL
      return NextResponse.json({
        url: `https://platform.composio.dev/connect/${composioAppId}`,
        demo: true,
      });
    }

    const data = await res.json();
    return NextResponse.json({
      url: data.redirectUrl || data.url,
      connectionId: data.connectionId,
    });
  } catch {
    // For demo, return a fake URL
    return NextResponse.json({
      url: `https://platform.composio.dev/connect/${composioAppId}`,
      demo: true,
    });
  }
}

// Check connection status
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const appId = searchParams.get('appId');

  try {
    const res = await fetch(`${COMPOSIO_BASE}/connectedAccounts`, {
      headers: {
        'x-api-key': COMPOSIO_API_KEY || '',
      },
    });

    if (!res.ok) {
      return NextResponse.json({ connected: false });
    }

    const data = await res.json();
    const isConnected = data.items?.some(
      (account: Record<string, unknown>) =>
        account.appName === (APP_ID_MAP[appId || ''] || appId) && account.status === 'ACTIVE'
    );

    return NextResponse.json({ connected: !!isConnected });
  } catch {
    return NextResponse.json({ connected: false });
  }
}
