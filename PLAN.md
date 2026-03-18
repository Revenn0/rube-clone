# Rube Clone — Implementation Plan

## Overview
Transform the current prototype into a production-ready B2B/B2C platform.
Total phases: 6 | Estimated time: ~4-6 hours

---

## Phase 1: Auth & Data Persistence (CRITICAL)
**Goal:** Users login, data persists in database, no more localStorage

- [ ] 1.1 Fix Clerk auth — redirect to /sign-in instead of 404
- [ ] 1.2 Create user sync on first login
- [ ] 1.3 Migrate chat sessions to Neon DB
- [ ] 1.4 Migrate chat messages to Neon DB
- [ ] 1.5 Load history from DB on sidebar
- [ ] 1.6 Test: login → create chat → reload → data persists

## Phase 2: Composio MCP Integration
**Goal:** Chat uses real Composio tools, OAuth works end-to-end

- [ ] 2.1 Install @composio/vercel and @ai-sdk/mcp
- [ ] 2.2 Create Composio MCP client in chat API
- [ ] 2.3 Pass tools to streamText
- [ ] 2.4 Test: "send an email" → AI uses Composio tool
- [ ] 2.5 Fix OAuth callback flow
- [ ] 2.6 Test: connect Gmail → OAuth → connected

## Phase 3: Workflow Engine
**Goal:** Scheduled tasks actually execute

- [ ] 3.1 Create cron worker (runs every minute)
- [ ] 3.2 Execute due workflows via Composio
- [ ] 3.3 Update execution history in DB
- [ ] 3.4 Handle one-time vs recurring
- [ ] 3.5 Test: create scheduled workflow → it executes

## Phase 4: UI Polish
**Goal:** Professional feel, no glitches

- [ ] 4.1 Add loading skeletons
- [ ] 4.2 Add error boundaries
- [ ] 4.3 Fix hydration warnings
- [ ] 4.4 Add toast notifications
- [ ] 4.5 Mobile: test all pages

## Phase 5: Real-time & Notifications
**Goal:** Live updates when workflows run

- [ ] 5.1 Add SSE for workflow status
- [ ] 5.2 Update workflow list in real-time
- [ ] 5.3 Push notifications (optional)

## Phase 6: Deploy & Production
**Goal:** Live on Vercel/production

- [ ] 6.1 Build check (no errors)
- [ ] 6.2 Environment variables documented
- [ ] 6.3 Deploy to Vercel
- [ ] 6.4 Test production build

---

## Status Tracking

| Phase | Status | Started | Completed |
|-------|--------|---------|-----------|
| 1. Auth & Persistence | 🔴 Not started | - | - |
| 2. Composio MCP | 🔴 Not started | - | - |
| 3. Workflow Engine | 🔴 Not started | - | - |
| 4. UI Polish | 🔴 Not started | - | - |
| 5. Real-time | 🔴 Not started | - | - |
| 6. Deploy | 🔴 Not started | - | - |
