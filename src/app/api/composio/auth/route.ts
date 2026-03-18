import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

const COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY;
const COMPOSIO_MCP_URL = process.env.COMPOSIO_MCP_URL;

async function callMCP(method: string, params: Record<string, unknown>) {
  try {
    const res = await fetch(COMPOSIO_MCP_URL!, {
      method: 'POST',
      headers: {
        'x-api-key': COMPOSIO_API_KEY!,
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
    });
    const text = await res.text();
    for (const line of text.split('\n')) {
      if (line.startsWith('data: ')) return JSON.parse(line.slice(6));
    }
    return null;
  } catch (err) {
    console.error('MCP error:', err);
    return null;
  }
}

// POST /api/composio/auth - Get auth link
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) user = await prisma.user.create({ data: { clerkId: userId, email: '' } });

  const { appId } = await req.json();

  const mcpSessionId = `user_${user.id}_${Date.now()}`;

  try {
    const result = await callMCP('tools/call', {
      name: 'COMPOSIO_MANAGE_CONNECTIONS',
      arguments: {
        toolkits: [appId],
        session_id: mcpSessionId,
      },
    });

    const resultText = result?.result?.content?.[0]?.text;
    if (resultText) {
      const data = JSON.parse(resultText);

      // Check if already connected
      if (data?.data?.status === 'Active' || data?.data?.connections?.[0]?.status === 'ACTIVE') {
        await prisma.appConnection.upsert({
          where: { userId_appId: { userId: user.id, appId } },
          update: { status: 'active', connectedAt: new Date() },
          create: { userId: user.id, appId, status: 'active', connectedAt: new Date() },
        });
        return NextResponse.json({ connected: true });
      }

      // Get redirect URL
      const redirectUrl = data?.data?.redirect_url;
      if (redirectUrl) {
        await prisma.appConnection.upsert({
          where: { userId_appId: { userId: user.id, appId } },
          update: { status: 'connecting' },
          create: { userId: user.id, appId, status: 'connecting' },
        });
        return NextResponse.json({ url: redirectUrl });
      }
    }

    return NextResponse.json({ error: 'No auth URL' });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// GET /api/composio/auth - Sync connection status from Composio
export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ connections: [] });

  // Check each connecting app
  const connecting = await prisma.appConnection.findMany({
    where: { userId: user.id, status: 'connecting' },
  });

  for (const conn of connecting) {
    // Re-check status with Composio
    try {
      const result = await callMCP('tools/call', {
        name: 'COMPOSIO_MANAGE_CONNECTIONS',
        arguments: {
          toolkits: [conn.appId],
          session_id: `check_${user.id}_${Date.now()}`,
        },
      });

      const text = result?.result?.content?.[0]?.text;
      if (text) {
        const data = JSON.parse(text);
        if (data?.data?.status === 'Active' || data?.data?.connections?.[0]?.status === 'ACTIVE') {
          await prisma.appConnection.update({
            where: { userId_appId: { userId: user.id, appId: conn.appId } },
            data: { status: 'active', connectedAt: new Date() },
          });
        }
      }
    } catch {}
  }

  // Return all connections
  const connections = await prisma.appConnection.findMany({
    where: { userId: user.id },
  });

  return NextResponse.json({ connections });
}
