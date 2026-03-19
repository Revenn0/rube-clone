import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-02-25.clover',
});

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret || !sig) {
    return NextResponse.json({ error: 'Webhook secret missing' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', msg);
    return NextResponse.json({ error: `Webhook Error: ${msg}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const clerkId = session.metadata?.clerkId as string | undefined;
        const planId = (session.metadata?.planId ?? 'free') as string;
        if (!clerkId) break;

        const user = await prisma.user.findUnique({ where: { clerkId } });
        if (!user) break;

        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string | null;

        let periodStart: Date | null = null;
        let periodEnd: Date | null = null;
        if (subscriptionId) {
          const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
          const item = stripeSub.items?.data?.[0];
          if (item) {
            periodStart = new Date(item.current_period_start * 1000);
            periodEnd = new Date(item.current_period_end * 1000);
          }
        }

        await prisma.subscription.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            plan: planId,
            status: 'active',
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
          },
          update: {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            plan: planId,
            status: 'active',
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
          },
        });
        await prisma.user.update({
          where: { id: user.id },
          data: { plan: planId },
        });
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const dbSub = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: sub.id },
        });
        if (!dbSub) break;

        const status = sub.status;
        const planId = status === 'active' ? (sub.metadata?.planId ?? dbSub.plan) : 'free';
        const item = sub.items?.data?.[0];
        const periodStart = item?.current_period_start ? new Date(item.current_period_start * 1000) : null;
        const periodEnd = item?.current_period_end ? new Date(item.current_period_end * 1000) : null;

        await prisma.subscription.update({
          where: { id: dbSub.id },
          data: {
            plan: planId,
            status: status === 'active' ? 'active' : status === 'canceled' ? 'canceled' : status,
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
          },
        });
        await prisma.user.update({
          where: { id: dbSub.userId },
          data: { plan: planId },
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subOrId = invoice.parent?.subscription_details?.subscription;
        const subscriptionId = typeof subOrId === 'string' ? subOrId : subOrId?.id ?? null;
        if (!subscriptionId) break;

        const dbSub = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: subscriptionId },
        });
        if (!dbSub) break;

        await prisma.subscription.update({
          where: { id: dbSub.id },
          data: { status: 'past_due' },
        });
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
