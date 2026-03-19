#!/usr/bin/env node
/**
 * Cria produtos e preços no Stripe para os planos Starter, Pro e Business.
 * Execute: STRIPE_SECRET_KEY=sk_test_xxx node scripts/create-stripe-products.mjs
 * Depois adicione os price IDs retornados ao .env.local:
 *   STRIPE_PRICE_STARTER=price_xxx
 *   STRIPE_PRICE_PRO=price_xxx
 *   STRIPE_PRICE_BUSINESS=price_xxx
 */

import Stripe from 'stripe';

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error('Defina STRIPE_SECRET_KEY. Ex: STRIPE_SECRET_KEY=sk_test_xxx node scripts/create-stripe-products.mjs');
  process.exit(1);
}

const stripe = new Stripe(key, { apiVersion: '2026-02-25.clover' });

const PLANS = [
  { id: 'starter', name: 'Starter', price: 4900, description: '500 execucoes/mes, 10 apps' },
  { id: 'pro', name: 'Pro', price: 14900, description: '3.000 execucoes/mes, apps ilimitados, 5 usuarios' },
  { id: 'business', name: 'Business', price: 39900, description: '15.000 execucoes/mes, apps ilimitados, 20 usuarios' },
];

async function main() {
  console.log('Criando produtos e precos no Stripe...\n');
  const envVars = [];

  for (const plan of PLANS) {
    const product = await stripe.products.create({
      name: `${plan.name} Plan`,
      description: plan.description,
    });
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.price,
      currency: 'usd',
      recurring: { interval: 'month' },
    });
    console.log(`${plan.name}: product=${product.id} price=${price.id}`);
    envVars.push(`STRIPE_PRICE_${plan.id.toUpperCase()}=${price.id}`);
  }

  console.log('\n--- Adicione ao .env.local ---');
  envVars.forEach((v) => console.log(v));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
