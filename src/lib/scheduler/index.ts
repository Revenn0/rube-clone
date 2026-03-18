import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const JOBS_FILE = path.join(process.cwd(), 'data', 'cron-jobs.json');

export interface CronJob {
  id: string;
  type: 'delayed' | 'recurring' | 'cron';
  message: string;
  description: string;
  executeAt?: number;        // for delayed (timestamp)
  intervalMs?: number;       // for recurring
  cron?: string;             // for cron
  sessionKey?: string;
  active: boolean;
  lastRun?: number;
  runCount: number;
  createdAt: number;
}

class Scheduler {
  private jobs: Map<string, CronJob> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.ensureDir();
    this.loadJobs();
  }

  private ensureDir() {
    const dir = path.dirname(JOBS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private loadJobs() {
    try {
      if (fs.existsSync(JOBS_FILE)) {
        const data: CronJob[] = JSON.parse(fs.readFileSync(JOBS_FILE, 'utf-8'));
        data.forEach(job => {
          this.jobs.set(job.id, job);
          if (job.active) this.scheduleJob(job);
        });
        console.log(`[Scheduler] Loaded ${this.jobs.size} jobs`);
      }
    } catch (err) {
      console.error('[Scheduler] Failed to load jobs:', err);
    }
  }

  private saveJobs() {
    try {
      fs.writeFileSync(JOBS_FILE, JSON.stringify(Array.from(this.jobs.values()), null, 2));
    } catch (err) {
      console.error('[Scheduler] Failed to save jobs:', err);
    }
  }

  private scheduleJob(job: CronJob) {
    if (this.timers.has(job.id)) {
      clearTimeout(this.timers.get(job.id)!);
      clearInterval(this.timers.get(job.id)!);
    }

    if (job.type === 'delayed' && job.executeAt) {
      const delay = job.executeAt - Date.now();
      if (delay > 0) {
        this.timers.set(job.id, setTimeout(() => this.executeJob(job), delay));
      }
    } else if (job.type === 'recurring' && job.intervalMs) {
      this.timers.set(job.id, setInterval(() => this.executeJob(job), job.intervalMs));
    }
  }

  private executeJob(job: CronJob) {
    job.lastRun = Date.now();
    job.runCount++;
    this.saveJobs();
    console.log(`[Scheduler] Executing job: ${job.description}`);

    // Emit event for the app to handle
    if (typeof global !== 'undefined') {
      (global as Record<string, unknown>)[`cron_event_${job.id}`] = {
        message: job.message,
        timestamp: Date.now(),
      };
    }
  }

  scheduleDelayed(message: string, delaySeconds: number, description?: string): CronJob {
    const id = uuidv4();
    const job: CronJob = {
      id,
      type: 'delayed',
      message,
      description: description || `Send in ${delaySeconds}s`,
      executeAt: Date.now() + delaySeconds * 1000,
      active: true,
      runCount: 0,
      createdAt: Date.now(),
    };
    this.jobs.set(id, job);
    this.saveJobs();
    this.scheduleJob(job);
    return job;
  }

  scheduleRecurring(message: string, intervalSeconds: number, description?: string): CronJob {
    const id = uuidv4();
    const job: CronJob = {
      id,
      type: 'recurring',
      message,
      description: description || `Every ${intervalSeconds}s`,
      intervalMs: intervalSeconds * 1000,
      active: true,
      runCount: 0,
      createdAt: Date.now(),
    };
    this.jobs.set(id, job);
    this.saveJobs();
    this.scheduleJob(job);
    return job;
  }

  scheduleCron(message: string, cron: string, description?: string): CronJob {
    const id = uuidv4();
    const job: CronJob = {
      id,
      type: 'cron',
      message,
      cron,
      description: description || `Cron: ${cron}`,
      active: true,
      runCount: 0,
      createdAt: Date.now(),
    };
    this.jobs.set(id, job);
    this.saveJobs();
    return job;
  }

  list(): CronJob[] {
    return Array.from(this.jobs.values()).map(j => ({ ...j }));
  }

  cancel(id: string): boolean {
    const job = this.jobs.get(id);
    if (!job) return false;

    if (this.timers.has(id)) {
      clearTimeout(this.timers.get(id)!);
      clearInterval(this.timers.get(id)!);
      this.timers.delete(id);
    }

    this.jobs.delete(id);
    this.saveJobs();
    return true;
  }

  getJob(id: string): CronJob | undefined {
    return this.jobs.get(id);
  }
}

// Singleton
let schedulerInstance: Scheduler | null = null;

export function getScheduler(): Scheduler {
  if (!schedulerInstance) {
    schedulerInstance = new Scheduler();
  }
  return schedulerInstance;
}
