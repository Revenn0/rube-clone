import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { getOrCreateUser } from '@/lib/auth';
import { getPlan, getPlanIds, type PlanId } from '@/lib/plans';
import { getMonthlyUsage } from '@/lib/usage';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-02-25.clover',
});

// GET - Retorna subscription atual + usage do mês
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [sub, usage] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId: user.id } }),
    getMonthlyUsage(user.id),
  ]);

  const planId = (sub?.plan ?? user.plan ?? 'free') as PlanId;
  const plan = getPlan(planId);

  return NextResponse.json({
    planId,
    plan: {
      id: plan.id,
      name: plan.name,
      price: plan.price,
      executionsLimit: plan.executionsLimit,
      features: plan.features,
    },
    usage,
    subscription: sub
      ? {
          status: sub.status,
          currentPeriodStart: sub.currentPeriodStart,
          currentPeriodEnd: sub.currentPeriodEnd,
          cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        }
      : null,
  });
}

// POST - Cria Stripe Checkout Session para upgrade
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await getOrCreateUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { planId } = (await req.json()) as { planId?: string };
  const validPlanIds: PlanId[] = ['starter', 'pro', 'business'];
  if (!planId || !validPlanIds.includes(planId as PlanId)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  const plan = getPlan(planId);
  if (!plan.stripePriceId) {
    return NextResponse.json({ error: 'Plan not available for checkout' }, { status: 400 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  try {
    let customerId: string | undefined;
    const existing = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });
    if (existing?.stripeCustomerId) {
      customerId = existing.stripeCustomerId;
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?billing=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?billing=cancelled`,
      metadata: { clerkId: userId, planId },
      subscription_data: { metadata: { clerkId: userId, planId } },
    };
    if (customerId) sessionParams.customer = customerId;
    else sessionParams.customer_email = user.email;

    const session = await stripe.checkout.sessions.create(sessionParams);
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Checkout failed' },
      { status: 500 }
    );
  }
}
