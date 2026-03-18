import { NextResponse } from 'next/server';

const COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY;
const COMPOSIO_MCP_URL = process.env.COMPOSIO_MCP_URL;

export async function GET() {
  try {
    const res = await fetch(COMPOSIO_MCP_URL!, {
      method: 'POST',
      headers: {
        'x-api-key': COMPOSIO_API_KEY!,
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {},
      }),
    });

    const text = await res.text();
    for (const line of text.split('\n')) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        const tools = data?.result?.tools || [];
        return NextResponse.json({
          tools: tools.map((t: { name: string; description?: string }) => ({
            name: t.name,
            description: t.description?.slice(0, 200),
          })),
          count: tools.length,
        });
      }
    }

    return NextResponse.json({ tools: [], count: 0 });
  } catch (err) {
    return NextResponse.json({ tools: [], error: String(err) });
  }
}
