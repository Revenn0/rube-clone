import { NextResponse } from 'next/server';
import { Composio } from '@composio/core';
import { getOrCreateUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
});

export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { connectedAccountId, appId }: { connectedAccountId?: string; appId?: string } =
    await req.json();

  if (connectedAccountId) {
    try {
      await composio.connectedAccounts.delete(connectedAccountId);
    } catch (err) {
      console.error('Composio disconnect error:', err);
      return NextResponse.json(
        { error: 'Failed to disconnect' },
        { status: 500 }
      );
    }
  }

  if (appId) {
    await prisma.appConnection.deleteMany({
      where: { userId: user.id, appId },
    });
  }

  return NextResponse.json({ success: true });
}
