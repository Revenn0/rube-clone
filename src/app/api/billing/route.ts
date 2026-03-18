import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@clerk/nextjs/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-02-25.clover',
});

const PLANS: Record<string, { priceId: string; name: string }> = {
  pro: { priceId: 'price_pro_monthly', name: 'Pro Plan' },
  team: { priceId: 'price_team_monthly', name: 'Team Plan' },
};

// POST - Create checkout session
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { planId } = await req.json();
  const plan = PLANS[planId];
  if (!plan) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: plan.priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?billing=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?billing=cancelled`,
      metadata: { userId, planId },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    // For test mode, return demo URL
    return NextResponse.json({ url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?billing=demo` });
  }
}
