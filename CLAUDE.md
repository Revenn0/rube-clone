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
- **Clerk** for auth (middleware protects `/chat`, `/apps`, `/schedule`, `/settings`, `/use-jungor`)
- **Prisma + Neon PostgreSQL** for persistence
- **AI Gateway** for AI chat (Vercel AI SDK)
- **Composio** for 500+ app integrations

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

### Composio SDK
```typescript
import { Composio } from '@composio/core';
import { VercelProvider } from '@composio/vercel';

const composio = new Composio({ apiKey: COMPOSIO_API_KEY, provider: new VercelProvider() });
const session = await composio.create(userId);  // userId = Clerk userId
const tools = await session.tools();
```

### AI Chat
Uses `createGateway` from `ai` package with AI_GATEWAY_API_KEY. Models: gpt-5.4, claude-sonnet, etc.

## Environment Variables

- `DATABASE_URL` — Neon PostgreSQL
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` — Clerk auth
- `AI_GATEWAY_API_KEY` — Vercel AI Gateway
- `COMPOSIO_API_KEY` — Composio
- `COMPOSIO_MCP_URL` — Composio MCP (optional, for workflow engine)
- `CRON_SECRET` — For Vercel Cron /api/cron/run

## Code Style

- shadcn/ui for all UI components
- Orange accent color: `#f26522`
- Mobile-first responsive design
