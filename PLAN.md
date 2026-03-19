# Jungor — Implementation Plan

## Overview
AI-powered app connector platform. Rebranded from Rube to Jungor.

## Completed

- Auth & Data Persistence (Clerk + Prisma + Neon)
- Composio SDK integration (Chat + OAuth + Tools)
- Workflow Engine (Vercel Cron runs due workflows every 5 min)
- Schedule page with nextRunAt
- Rebranding Rube → Jungor
- NLP schedule parsing (natural language → frequency/time)
- Popup de confirmação ao criar schedule
- Live Execution Panel (sidebar com tool invocations)
- Projetos (nova aba, CRUD, múltiplos chats por projeto)
- Schedule: editar task ao clicar
- Remoção de deps não usadas (bullmq, ioredis, node-cron)

## Deploy

```bash
vercel --prod
# Set CRON_SECRET in Vercel Dashboard for /api/cron/run
```
