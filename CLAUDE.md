# CLAUDE.md — AI Assistant Instructions

## Build & Run

```bash
npm install
npx prisma db push        # sync database schema
npm run dev               # development server on :3000
npm run build             # production build
```

## Architecture

- **Next.js 16 App Router** with TypeScript
- **Clerk** for auth (middleware protects `/chat`, `/apps`, `/workflows`, `/settings`)
- **Prisma + Neon PostgreSQL** for persistence
- **OpenRouter** for AI chat (free Nemotron model)
- **Composio MCP** for 500+ app integrations

## Key Patterns

### Auth in API routes
```typescript
import { auth } from '@clerk/nextjs/server';
const { userId } = await auth();
if (!userId) return new Response('Unauthorized', { status: 401 });
```

### Database
```typescript
import { prisma } from '@/lib/db';
const user = await prisma.user.findUnique({ where: { clerkId: userId } });
```

### Composio SDK (v3)
```typescript
import { Composio } from '@composio/core';
import { VercelProvider } from '@composio/vercel';

const composio = new Composio({ provider: new VercelProvider() });
const session = await composio.create(userId);  // userId = Clerk userId
const tools = await session.tools();
// Pass tools to streamText for chat
// session.authorize(toolkit) for OAuth
// composio.connectedAccounts.delete(id) for disconnect
```

### AI Chat streaming
```typescript
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText } from 'ai';
const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });
const result = streamText({ model: openrouter('nvidia/nemotron-3-super-120b-a12b:free'), messages });
return result.toTextStreamResponse();
```

## Environment Variables

Required in `.env.local`:
- `DATABASE_URL` — Neon PostgreSQL connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` — Clerk auth
- `OPENROUTER_API_KEY` — OpenRouter API key
- `COMPOSIO_API_KEY` — Composio API key
- `COMPOSIO_MCP_URL` — Composio MCP endpoint URL

## Code Style

- No `useEffect` for one-time init — use `useRef` to track initialization
- Keep state local — only use Zustand for cross-component persistent state
- shadcn/ui for all UI components
- Orange accent color: `#f26522`
- Mobile-first responsive design
