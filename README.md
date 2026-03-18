# Rube Clone

A clone of [Rube.app](https://rube.app) — connect anything to anything.

## Tech Stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **Tailwind CSS** — dark theme with orange accents
- **Vercel AI SDK** — streaming chat with OpenAI
- **Composio SDK** — app integrations (100+ apps)
- **Zustand** — state management
- **Lucide React** — icons

## Pages

| Route | Description |
|-------|-------------|
| `/chat` | AI chat interface — ask to connect apps & automate |
| `/apps` | App catalog — browse & connect integrations |
| `/workflows` | Workflow manager — create & manage automations |
| `/settings` | API keys, model config, Composio dashboard |

## Getting Started

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env.local
# Edit .env.local with your keys:
# - OPENAI_API_KEY (for AI chat)
# - COMPOSIO_API_KEY (for app integrations)

# Run dev server
npm run dev

# Build for production
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── (app)/           # App layout with sidebar
│   │   ├── chat/        # Chat page
│   │   ├── apps/        # Apps catalog
│   │   ├── workflows/   # Workflows manager
│   │   └── settings/    # Settings page
│   ├── api/
│   │   ├── chat/        # AI chat API (streaming)
│   │   └── apps/        # Apps API
│   └── globals.css      # Global styles
├── components/
│   ├── ui/              # Reusable UI components
│   ├── layout/          # Sidebar, Header
│   ├── apps/            # App cards, filters
│   └── chat/            # Chat interface
├── lib/
│   ├── apps.ts          # App data & categories
│   ├── store.ts         # Zustand stores
│   └── utils.ts         # Utility functions
└── types/
    └── index.ts         # TypeScript types
```

## Design

Dark theme inspired by the original Rube.app:
- Background: `#0a0a0a`
- Cards: `#141414`
- Borders: `#262626`
- Accent: `#ff6b00` (orange)
- Text: `#fafafa` / `#737373` (muted)

## Adding Composio Integration

1. Get your API key from [Composio](https://composio.dev)
2. Add it to `.env.local` as `COMPOSIO_API_KEY`
3. In `src/app/api/chat/route.ts`, use Composio to execute actions:

```typescript
import { Composio } from '@composio/core';

const composio = new Composio(process.env.COMPOSIO_API_KEY);

// In your chat handler:
const result = await composio.actions.execute({
  action: 'GMAIL_SEND_EMAIL',
  params: { to, subject, body },
});
```

## Next Steps

- [ ] Connect Composio SDK for real app actions
- [ ] Add OAuth flow for app authentication
- [ ] Implement workflow builder (visual editor)
- [ ] Add workflow triggers (webhooks, cron)
- [ ] Persist data (PostgreSQL)
- [ ] Add user authentication
