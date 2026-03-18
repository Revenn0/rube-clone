import { NextResponse } from 'next/server';
import { getScheduler } from '@/lib/scheduler';

export async function GET() {
  const scheduler = getScheduler();
  const jobs = scheduler.list();
  return NextResponse.json({ jobs });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { action, message, delaySeconds, intervalSeconds, cron, description, jobId } = body;

  const scheduler = getScheduler();

  switch (action) {
    case 'schedule_delayed': {
      if (!message || !delaySeconds) {
        return NextResponse.json({ error: 'message and delaySeconds required' }, { status: 400 });
      }
      const job = scheduler.scheduleDelayed(message, delaySeconds, description);
      return NextResponse.json({ job });
    }

    case 'schedule_recurring': {
      if (!message || !intervalSeconds) {
        return NextResponse.json({ error: 'message and intervalSeconds required' }, { status: 400 });
      }
      const job = scheduler.scheduleRecurring(message, intervalSeconds, description);
      return NextResponse.json({ job });
    }

    case 'schedule_cron': {
      if (!message || !cron) {
        return NextResponse.json({ error: 'message and cron expression required' }, { status: 400 });
      }
      const job = scheduler.scheduleCron(message, cron, description);
      return NextResponse.json({ job });
    }

    case 'cancel': {
      if (!jobId) {
        return NextResponse.json({ error: 'jobId required' }, { status: 400 });
      }
      const cancelled = scheduler.cancel(jobId);
      return NextResponse.json({ cancelled });
    }

    case 'list': {
      return NextResponse.json({ jobs: scheduler.list() });
    }

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}
