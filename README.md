# Rube Clone — AI-Powered App Connector Platform

A clone of [Rube.app](https://rube.app) — connect your apps and automate workflows with AI. Built with Next.js, Clerk, Neon PostgreSQL, OpenRouter, and Composio MCP.

## Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript, Turbopack)
- **Auth:** Clerk
- **Database:** Neon PostgreSQL + Prisma ORM
- **AI:** OpenRouter (Nemotron 120B free model)
- **Integrations:** Composio MCP (500+ apps: Gmail, Slack, GitHub, etc.)
- **UI:** Tailwind CSS + shadcn/ui
- **State:** React useState (lightweight)

## Pages

| Route | Description |
|-------|-------------|
| `/chat` | AI chat with Composio app integration |
| `/apps` | Connect/disconnect apps via OAuth |
| `/workflows` | View and manage scheduled workflows |
| `/settings` | Model selection and configuration |
| `/sign-in` | Clerk authentication |

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/chat` | POST | Stream AI responses (OpenRouter) |
| `/api/sessions` | GET/POST/DELETE | Chat session CRUD |
| `/api/composio/auth` | GET/POST | Get OAuth links, check status |
| `/api/composio/tools` | GET | List available Composio tools |
| `/api/workflows` | CRUD | Workflow management |
| `/api/status` | GET | Health check |

## Quick Start

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env.local
# Fill in your keys:
# - OPENROUTER_API_KEY (from openrouter.ai)
# - COMPOSIO_API_KEY (from platform.composio.dev)
# - Clerk keys (from dashboard.clerk.com)
# - DATABASE_URL (from console.neon.tech)

# Push database schema
npx prisma db push

# Run development server
npm run dev
```

## Environment Variables

```env
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/chat
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/chat

# AI (OpenRouter)
OPENROUTER_API_KEY=sk-or-...

# Integrations (Composio)
COMPOSIO_API_KEY=ak_...
COMPOSIO_MCP_URL=https://backend.composio.dev/tool_router/TRS_ID/mcp

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Database Schema (Prisma)

Key models:
- `User` — synced with Clerk auth
- `ChatSession` + `ChatMessage` — persistent chat history
- `Workflow` — scheduled automations
- `WorkflowExecution` — execution logs
- `AppConnection` — OAuth tokens for connected apps
- `AuditLog` — action tracking

## Project Structure

```
src/
├── app/
│   ├── (app)/              # Authenticated pages
│   │   ├── chat/           # AI chat interface
│   │   ├── apps/           # App connections
│   │   ├── workflows/      # Workflow manager
│   │   └── settings/       # Configuration
│   ├── api/                # Backend API routes
│   │   ├── chat/           # AI streaming endpoint
│   │   ├── sessions/       # Chat session management
│   │   ├── composio/       # Composio integration
│   │   └── workflows/      # Workflow CRUD
│   ├── sign-in/            # Clerk auth pages
│   └── sign-up/
├── components/
│   ├── chat/               # Chat UI components
│   ├── layout/             # Sidebar, header
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── db.ts               # Prisma client
│   ├── chat-store.ts       # Zustand state
│   └── utils.ts            # Utilities
└── middleware.ts            # Clerk auth middleware
```

## For AI Coding Assistants

When working on this codebase:

1. **Database:** Always use Prisma ORM. Schema is in `prisma/schema.prisma`. Run `npx prisma db push` after changes.

2. **Auth:** Use `import { auth } from '@clerk/nextjs/server'` in API routes. Wrap pages with ClerkProvider in layout.

3. **Chat API:** Uses OpenRouter via `@openrouter/ai-sdk-provider`. Model: `nvidia/nemotron-3-super-120b-a12b:free` (free tier).

4. **Composio Integration:** MCP endpoint at `COMPOSIO_MCP_URL`. Call with POST, parse SSE response (`data: {...}`).

5. **UI:** Use shadcn/ui components. Dark/light theme with orange accent (#f26522).

6. **State:** Use React useState for local state. Zustand only for cross-component persistent state.

7. **Build:** `npm run build` for production. TypeScript strict mode enabled.

## Composio MCP Integration

The platform uses Composio's MCP (Model Context Protocol) endpoint for app integrations:

```typescript
// Call Composio MCP
const res = await fetch(COMPOSIO_MCP_URL, {
  method: 'POST',
  headers: {
    'x-api-key': COMPOSIO_API_KEY,
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: { name: 'TOOL_NAME', arguments: {...} }
  }),
});
// Parse SSE response
const text = await res.text();
for (const line of text.split('\n')) {
  if (line.startsWith('data: ')) return JSON.parse(line.slice(6));
}
```

Available meta-tools:
- `COMPOSIO_SEARCH_TOOLS` — discover tools for a use case
- `COMPOSIO_MANAGE_CONNECTIONS` — get OAuth URLs, check status
- `COMPOSIO_MULTI_EXECUTE_TOOL` — execute actions
- `COMPOSIO_GET_TOOL_SCHEMAS` — get tool input schemas

## License

MIT
