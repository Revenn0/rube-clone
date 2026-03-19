# Jungor — AI-Powered App Connector Platform

Connect your apps and automate workflows with AI. Built with Next.js, Clerk, Neon PostgreSQL, AI Gateway, and Composio.

## Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript, Turbopack)
- **Auth:** Clerk
- **Database:** Neon PostgreSQL + Prisma ORM
- **AI:** Vercel AI Gateway (GPT, Claude, etc.)
- **Integrations:** Composio (500+ apps: Gmail, Slack, GitHub, etc.)
- **UI:** Tailwind CSS + shadcn/ui
- **State:** React useState (lightweight)

## Pages

| Route | Description |
|-------|-------------|
| `/chat` | AI chat with Composio app integration |
| `/apps` | Connect/disconnect apps via OAuth |
| `/schedule` | View and manage scheduled workflows |
| `/settings` | Account, billing, activity |
| `/sign-in` | Clerk authentication |

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/chat` | POST | Stream AI responses |
| `/api/sessions` | GET/POST/DELETE | Chat session CRUD |
| `/api/schedule` | GET/POST/DELETE | Schedule management |
| `/api/composio/*` | Various | OAuth, tools, connections |
| `/api/cron/run` | GET | Vercel Cron — runs due workflows |
| `/api/status` | GET | Health check |

## Quick Start

```bash
npm install
cp .env.example .env.local
# Fill in: DATABASE_URL, Clerk keys, AI_GATEWAY_API_KEY, COMPOSIO_API_KEY, CRON_SECRET
npx prisma db push   # Creates Project table if new
npm run dev
```

## Environment Variables

```env
DATABASE_URL=postgresql://...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
AI_GATEWAY_API_KEY=...
COMPOSIO_API_KEY=ak_...
COMPOSIO_MCP_URL=https://backend.composio.dev/...
CRON_SECRET=...  # For Vercel Cron /api/cron/run
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## License

MIT
