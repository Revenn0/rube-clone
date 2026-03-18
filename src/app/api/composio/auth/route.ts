import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getOrCreateUser } from '@/lib/auth';

const COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY;
const COMPOSIO_MCP_URL = process.env.COMPOSIO_MCP_URL;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function mcpCall(name: string, args: Record<string, unknown>) {
  try {
    const res = await fetch(COMPOSIO_MCP_URL!, {
      method: 'POST',
      headers: {
        'x-api-key': COMPOSIO_API_KEY!,
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method: 'tools/call', params: { name, arguments: args } }),
    });
    const text = await res.text();
    for (const line of text.split('\n')) {
      if (line.startsWith('data: ')) return JSON.parse(line.slice(6));
    }
    return null;
  } catch (err) { console.error(err); return null; }
}

// POST - Get OAuth link for an app
export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { appId } = await req.json();
  // Composio requires Clerk userId to scope connections
  const mcpSessionId = user.clerkId;

  const result = await mcpCall('COMPOSIO_MANAGE_CONNECTIONS', {
    toolkits: [appId],
    session_id: mcpSessionId,
  });

  const text = result?.result?.content?.[0]?.text;
  if (text) {
    try {
      const data = JSON.parse(text);
      
      // Already connected
      if (data?.data?.status === 'Active' || data?.data?.connections?.[0]?.status === 'ACTIVE') {
        await prisma.appConnection.upsert({
          where: { userId_appId: { userId: user.id, appId } },
          update: { status: 'active', connectedAt: new Date() },
          create: { userId: user.id, appId, status: 'active', connectedAt: new Date() },
        });
        return NextResponse.json({ connected: true });
      }

      const url = data?.data?.redirect_url;
      if (url) {
        // Add callback URL
        const callbackUrl = `${APP_URL}/api/composio/callback?appId=${appId}&userId=${user.id}`;
        const finalUrl = url.includes('?') ? `${url}&callback_url=${encodeURIComponent(callbackUrl)}` : `${url}?callback_url=${encodeURIComponent(callbackUrl)}`;
        
        await prisma.appConnection.upsert({
          where: { userId_appId: { userId: user.id, appId } },
          update: { status: 'connecting' },
          create: { userId: user.id, appId, status: 'connecting' },
        });
        
        return NextResponse.json({ url: finalUrl });
      }
    } catch {}
  }

  return NextResponse.json({ error: 'Failed to get connection URL' });
}

// GET - List connections or check status
export async function GET() {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ connections: [] });

  const connections = await prisma.appConnection.findMany({
    where: { userId: user.id },
  });

  return NextResponse.json({ connections });
}
