import { NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getNextRunFromCron } from '@/lib/workflow-engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ tasks: [] });

  try {
    const workflows = await prisma.workflow.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    const tasks = workflows.map((w) => {
      const trigger = w.trigger as { type?: string; cron?: string; time?: string };
      return {
        id: w.id,
        name: w.name,
        prompt: w.description ?? '',
        schedule: trigger?.cron ?? 'daily',
        time: trigger?.time ?? '09:00',
        nextRun: w.nextRunAt?.toISOString(),
        status: w.status,
      };
    });
    return NextResponse.json({ tasks });
  } catch (err) {
    console.error('Schedule list error:', err);
    return NextResponse.json({ tasks: [] });
  }
}

export async function POST(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, prompt, schedule, time } = body as { name: string; prompt: string; schedule: string; time?: string };

  if (!name || !prompt) {
    return NextResponse.json({ error: 'name and prompt required' }, { status: 400 });
  }

  try {
    const hour = parseInt((time || '09:00').split(':')[0], 10) || 9;
    const cronExpr =
      schedule === 'daily'
        ? `0 ${hour} * * *`
        : schedule === 'weekly'
          ? `0 ${hour} * * 1`
          : schedule === 'monthly'
            ? `0 ${hour} 1 * *`
            : `0 ${hour} * * *`;
    const nextRunAt = getNextRunFromCron(cronExpr);

    const workflow = await prisma.workflow.create({
      data: {
        userId: user.id,
        name,
        description: prompt,
        apps: [],
        trigger: { type: 'schedule', cron: cronExpr, time: time || '09:00' },
        actions: [{ type: 'chat', prompt }],
        status: 'active',
        nextRunAt,
      },
    });
    return NextResponse.json({
      task: {
        id: workflow.id,
        name: workflow.name,
        prompt: workflow.description ?? '',
        schedule: (workflow.trigger as { cron?: string })?.cron ?? 'daily',
        time: (workflow.trigger as { time?: string })?.time ?? '09:00',
        status: workflow.status,
      },
    });
  } catch (err) {
    console.error('Schedule create error:', err);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { id, name, prompt, schedule, time } = body as {
    id: string;
    name?: string;
    prompt?: string;
    schedule?: string;
    time?: string;
  };

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  try {
    const workflow = await prisma.workflow.findFirst({
      where: { id, userId: user.id },
    });
    if (!workflow) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const update: Record<string, unknown> = {};
    if (name != null) update.name = name;
    if (prompt != null) update.description = prompt;

    if (schedule != null || time != null) {
      const s = schedule ?? 'daily';
      const t = time ?? (workflow.trigger as { time?: string })?.time ?? '09:00';
      const hour = parseInt((t || '09:00').split(':')[0], 10) || 9;
      const cronExpr =
        s === 'daily' ? `0 ${hour} * * *` : s === 'weekly' ? `0 ${hour} * * 1` : s === 'monthly' ? `0 ${hour} 1 * *` : `0 ${hour} * * *`;
      const currentActions = workflow.actions as Array<{ type?: string; prompt?: string }>;
      const currentPrompt = currentActions?.[0]?.prompt ?? workflow.description ?? '';
      update.trigger = { type: 'schedule', cron: cronExpr, time: t };
      update.actions = [{ type: 'chat', prompt: prompt ?? currentPrompt }];
      update.nextRunAt = getNextRunFromCron(cronExpr);
    }

    await prisma.workflow.update({
      where: { id },
      data: update as never,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Schedule update error:', err);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  try {
    await prisma.workflow.deleteMany({ where: { id, userId: user.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Schedule delete error:', err);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
