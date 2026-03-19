import { prisma } from '@/lib/db';
import { getPlan, type PlanId } from '@/lib/plans';

const now = new Date();
const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

function isPrismaSchemaError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('does not exist') ||
    msg.includes('relation') ||
    msg.includes('P2021') ||
    msg.includes('P2018') ||
    msg.includes('Invalid `prisma.')
  );
}

export async function getMonthlyUsage(userId: string): Promise<number> {
  try {
    const count = await prisma.usageRecord.count({
      where: {
        userId,
        type: 'tool_call',
        createdAt: { gte: startOfMonth },
      },
    });
    return count;
  } catch (err) {
    if (isPrismaSchemaError(err)) {
      console.warn('UsageRecord table may not exist, returning 0 usage:', err);
      return 0;
    }
    throw err;
  }
}

export async function getUserPlan(userId: string): Promise<{ planId: PlanId; plan: ReturnType<typeof getPlan> }> {
  try {
    const [sub, user] = await Promise.all([
      prisma.subscription.findUnique({ where: { userId } }),
      prisma.user.findUnique({ where: { id: userId }, select: { plan: true } }),
    ]);
    const planId = (sub?.plan ?? user?.plan ?? 'free') as PlanId;
    return { planId, plan: getPlan(planId) };
  } catch (err) {
    if (isPrismaSchemaError(err)) {
      console.warn('Subscription/User query failed, defaulting to free plan:', err);
      return { planId: 'free', plan: getPlan('free') };
    }
    throw err;
  }
}

export async function checkUsageLimit(userId: string): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
}> {
  const [used, { plan }] = await Promise.all([
    getMonthlyUsage(userId),
    getUserPlan(userId),
  ]);
  const limit = plan.executionsLimit;
  return {
    allowed: limit < 0 || used < limit,
    used,
    limit: limit < 0 ? Number.MAX_SAFE_INTEGER : limit,
  };
}

export async function recordToolExecution(
  userId: string,
  toolName: string | undefined,
  sessionId: string | undefined
): Promise<void> {
  try {
    await prisma.usageRecord.create({
      data: {
        userId,
        type: 'tool_call',
        toolName: toolName ?? undefined,
        sessionId: sessionId ?? undefined,
      },
    });
  } catch (err) {
    if (isPrismaSchemaError(err)) {
      console.warn('Could not record tool execution (UsageRecord table may not exist):', err);
      return;
    }
    throw err;
  }
}
