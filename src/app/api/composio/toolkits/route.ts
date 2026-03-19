import { NextResponse } from 'next/server';
import { Composio } from '@composio/core';
import { getOrCreateUser } from '@/lib/auth';
import { isKnownUnsupportedToolkit } from '@/lib/composio-unsupported';

const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
});

const COMPOSIO_BASE = 'https://backend.composio.dev/api/v3';

export const dynamic = 'force-dynamic';

// GET - List toolkits with pagination (limit=20, offset=0)
export async function GET(req: Request) {
  const user = await getOrCreateUser();
  if (!user) {
    return NextResponse.json({ toolkits: [], hasMore: false });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '30', 10), 100);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const search = (searchParams.get('search') || '').trim().toLowerCase();

  try {
    // 1. Fetch toolkits from Composio REST API until we have enough for this page
    const allItems: Array<Record<string, unknown>> = [];
    let cursor: string | undefined;
    const targetCount = offset + limit + 1;

    do {
      const url = new URL(`${COMPOSIO_BASE}/toolkits`);
      url.searchParams.set('limit', '500');
      if (cursor) url.searchParams.set('cursor', cursor);
      const res = await fetch(url.toString(), {
        headers: { 'x-api-key': process.env.COMPOSIO_API_KEY || '' },
      });
      const data = (await res.json()) as { items?: Array<Record<string, unknown>>; next_cursor?: string };
      const items = data.items ?? [];
      for (const t of items) {
        const meta = (t.meta as Record<string, unknown>) ?? {};
        if ((t as { noAuth?: boolean }).noAuth) continue;
        allItems.push({
          slug: t.slug,
          name: t.name,
          description: meta.description ?? '',
          logo: meta.logo ?? '',
          tools_count: meta.tools_count ?? meta.toolsCount ?? 0,
          categories: meta.categories ?? [],
        });
      }
      cursor = data.next_cursor;
    } while (cursor && allItems.length < targetCount);

    // 2. Get user's connection status from session.toolkits
    const session = await composio.create(user.clerkId);
    const { items: sessionItems } = await session.toolkits({ limit: 500 });
    const connectionBySlug = new Map(
      sessionItems.map((t) => [
        t.slug,
        {
          isConnected: t.connection?.isActive ?? false,
          connectedAccountId: t.connection?.connectedAccount?.id,
        },
      ])
    );

    // 3. Merge toolkits with connection status
    let merged = allItems.map((t) => {
      const slug = t.slug as string;
      return {
        slug,
        name: t.name as string,
        description: t.description as string,
        logo: t.logo as string,
        tools_count: t.tools_count as number,
        categories: t.categories as Array<{ slug?: string; id?: string; name: string }>,
        isConnected: connectionBySlug.get(slug)?.isConnected ?? false,
        connectedAccountId: connectionBySlug.get(slug)?.connectedAccountId,
        authorizeUnsupported: isKnownUnsupportedToolkit(slug),
      };
    });

    // 4. Filter by search (server-side)
    if (search) {
      merged = merged.filter(
        (t) =>
          t.name.toLowerCase().includes(search) ||
          t.description.toLowerCase().includes(search) ||
          t.slug.toLowerCase().includes(search)
      );
    }

    // 5. Paginate
    const toolkits = merged.slice(offset, offset + limit);
    const hasMore = merged.length > offset + limit;
    const totalFetched = merged.length;

    return NextResponse.json({ toolkits, hasMore, totalFetched });
  } catch (err) {
    console.error('Composio toolkits error:', err);
    return NextResponse.json({ toolkits: [] });
  }
}
