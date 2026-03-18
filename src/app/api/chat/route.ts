import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText } from 'ai';
import { prisma } from '@/lib/db';

export const maxDuration = 30;

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY;
const COMPOSIO_MCP_URL = process.env.COMPOSIO_MCP_URL;

// MCP call helper
async function mcpCall(name: string, args: Record<string, unknown>, sessionId?: string) {
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
        method: 'tools/call',
        params: { name, arguments: { ...args, session_id: sessionId } },
      }),
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

export async function POST(req: Request) {
  const { messages, sessionId } = await req.json();
  const lastUserMsg = messages.filter((m: { role: string }) => m.role === 'user').pop()?.content || '';

  // Search Composio for relevant tools
  let toolContext = '';
  try {
    const mcpSessionId = `session_${Date.now()}`;
    const searchResult = await mcpCall('COMPOSIO_SEARCH_TOOLS', {
      queries: [{ use_case: lastUserMsg.slice(0, 300) }],
      session: { id: mcpSessionId, generate_id: true },
    }, mcpSessionId);

    const searchText = searchResult?.result?.content?.[0]?.text;
    if (searchText) {
      try {
        const data = JSON.parse(searchText);
        const result = data?.data?.results?.[0];
        if (result?.tools?.length > 0) {
          toolContext = '\n\nAvailable Composio tools:\n' +
            result.tools.map((t: { tool_slug: string }) => `• ${t.tool_slug}`).join('\n');
          
          // Check connection status
          if (result.connection_info?.status !== 'Active') {
            const manageResult = await mcpCall('COMPOSIO_MANAGE_CONNECTIONS', {
              toolkits: [result.tools[0]?.tool_slug?.split('_')[0]?.toLowerCase()],
              session_id: mcpSessionId,
            }, mcpSessionId);
            
            const manageText = manageResult?.result?.content?.[0]?.text;
            if (manageText) {
              try {
                const manageData = JSON.parse(manageText);
                const url = manageData?.data?.redirect_url;
                if (url) {
                  toolContext += `\n\n[CONNECT]${url}[ENDCONNECT]`;
                }
              } catch {}
            }
          }
        }
      } catch {}
    }
  } catch {}

  const result = streamText({
    model: openrouter('nvidia/nemotron-3-super-120b-a12b:free'),
    system: `You are Rube, an AI assistant. You have access to apps via Composio.
When you see [CONNECT]...[ENDCONNECT], share the URL with the user and ask them to connect.
After connecting, help them complete their task.
Be concise and helpful.${toolContext}`,
    messages,
  });

  return result.toTextStreamResponse();
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  if (!sessionId) return Response.json({ messages: [] });
  try {
    const msgs = await prisma.chatMessage.findMany({ where: { sessionId }, orderBy: { createdAt: 'asc' }, take: 100 });
    return Response.json({ messages: msgs });
  } catch {
    return Response.json({ messages: [] });
  }
}
