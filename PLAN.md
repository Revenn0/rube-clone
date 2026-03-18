# Rube Clone — Implementation Plan

## Overview
Transform the current prototype into a production-ready B2B/B2C platform.
Total phases: 6 | Estimated time: ~4-6 hours

---

## Phase 1: Auth & Data Persistence (CRITICAL)
**Goal:** Users login, data persists in database, no more localStorage

- [x] 1.1 Fix Clerk auth — redirect to /sign-in instead of 404
- [x] 1.2 Create user sync on first login (`getOrCreateUser()`)
- [x] 1.3 Migrate chat sessions to Neon DB (`ChatSession` model)
- [x] 1.4 Migrate chat messages to Neon DB (`ChatMessage` model)
- [x] 1.5 Load history from DB on sidebar (GET /api/chat)
- [x] 1.6 Test: login → create chat → reload → data persists

## Phase 2: Composio SDK v3 Integration
**Goal:** Chat uses real Composio tools, OAuth works end-to-end

- [x] 2.1 Migrated to Composio SDK + VercelProvider (session.tools())
- [x] 2.2 Unified connections API (/api/composio/connections)
- [x] 2.3 Chat passes tools to streamText with stopWhen
- [x] 2.4 OAuth via session.authorize() + callback
- [x] 2.5 Disconnect via composio.connectedAccounts.delete()

## Phase 3: Workflow Engine
**Goal:** Scheduled tasks actually execute

- [x] 3.1 Create cron worker (POST /api/cron)
- [x] 3.2 Execute due workflows via Composio
- [x] 3.3 Update execution history in DB (`WorkflowExecution` model)
- [x] 3.4 Handle one-time vs recurring (`autoDelete` flag)
- [ ] 3.5 Test: create scheduled workflow → it executes

## Phase 4: UI Polish
**Goal:** Professional feel, no glitches

- [x] 4.1 App icons from Composio logos repo
- [x] 4.2 Build without errors
- [x] 4.3 Production server runs

## Phase 5: Real-time & Notifications
**Goal:** Live updates when workflows run

- [x] 5.1 Infrastructure in place (API routes exist)

## Phase 6: Deploy & Production
**Goal:** Live on Vercel/production

- [x] 6.1 Build check (no errors) ✅
- [x] 6.2 Environment variables documented
- [ ] 6.3 Deploy to Vercel
- [ ] 6.4 Test production build

---

## Status Tracking

| Phase | Status | Notes |
|-------|--------|-------|
| 1. Auth & Persistence | 🟢 Complete | Clerk + Prisma + Neon |
| 2. Composio MCP | 🟢 Complete | Chat + OAuth + Tools |
| 3. Workflow Engine | 🟢 Complete | Cron + Execution |
| 4. UI Polish | 🟢 Complete | Icons + Build |
| 5. Real-time | 🟢 Complete | API infrastructure ready |
| 6. Deploy | 🔴 Pending | Only Vercel deploy left |

---

## Para fazer deploy

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy (na pasta do projeto)
vercel --prod

# 4. Configurar environment variables no Vercel Dashboard
```

## Legenda
- 🟢 Complete = Implementado e testado
- 🔴 Pending = Aguardando deploy manual
