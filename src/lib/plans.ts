export type PlanId = 'free' | 'starter' | 'pro' | 'business';

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  stripePriceId: string | null;
  executionsLimit: number;
  appsLimit: number;
  seatsLimit: number;
  features: string[];
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    stripePriceId: null,
    executionsLimit: 30,
    appsLimit: 2,
    seatsLimit: 1,
    features: [
      '30 execucoes/mes',
      '2 apps conectados',
      'Claude Sonnet 4.6',
      'Uso pessoal',
    ],
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 49,
    stripePriceId: process.env.STRIPE_PRICE_STARTER ?? 'price_starter_monthly',
    executionsLimit: 500,
    appsLimit: 10,
    seatsLimit: 1,
    features: [
      '500 execucoes/mes',
      '10 apps conectados',
      'Claude Sonnet 4.6',
      'Recipes e Schedules',
      '1 usuario',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 149,
    stripePriceId: process.env.STRIPE_PRICE_PRO ?? 'price_pro_monthly',
    executionsLimit: 3000,
    appsLimit: -1,
    seatsLimit: 5,
    features: [
      '3.000 execucoes/mes',
      'Apps ilimitados',
      'Claude Sonnet 4.6',
      '5 usuarios',
      'Workflows ilimitados',
      'Historico 90 dias',
    ],
  },
  business: {
    id: 'business',
    name: 'Business',
    price: 399,
    stripePriceId: process.env.STRIPE_PRICE_BUSINESS ?? 'price_business_monthly',
    executionsLimit: 15000,
    appsLimit: -1,
    seatsLimit: 20,
    features: [
      '15.000 execucoes/mes',
      'Apps ilimitados',
      'Claude Sonnet 4.6',
      '20 usuarios',
      'SSO / SAML',
      'Workspace compartilhado',
      'Suporte prioritario',
      'SLA 99.5%',
    ],
  },
};

export function getPlan(planId: string): Plan {
  const id = (planId?.toLowerCase() ?? 'free') as PlanId;
  return PLANS[id] ?? PLANS.free;
}

export function getPlanIds(): PlanId[] {
  return ['free', 'starter', 'pro', 'business'];
}
