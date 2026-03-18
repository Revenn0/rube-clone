'use client';

import { useState } from 'react';

const PLANS = [
  { id: 'free', name: 'Free', price: '$0', features: ['5 workflows', '3 apps', '100 executions/mo'] },
  { id: 'pro', name: 'Pro', price: '$19/mo', features: ['Unlimited workflows', '20 apps', '5000 executions/mo', 'Priority support'] },
  { id: 'team', name: 'Team', price: '$49/mo', features: ['Everything in Pro', 'Unlimited seats', 'Admin panel', 'SSO'] },
];

export default function SettingsPageClient() {
  const [currentPlan] = useState('free');

  return (
    <div className="min-h-full px-4 sm:px-6 py-5 sm:py-6">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Model */}
        <div>
          <h3 className="text-sm font-medium text-[#0a0a0a] mb-3">AI Model</h3>
          <select className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2.5 text-sm text-[#0a0a0a]">
            <option value="nemotron">Nemotron 120B (Free)</option>
            <option value="llama">Llama 3.1 70B (Free)</option>
            <option value="gemini">Gemini 2.0 Flash (Free)</option>
          </select>
        </div>

        {/* Billing */}
        <div>
          <h3 className="text-sm font-medium text-[#0a0a0a] mb-3">Billing</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PLANS.map((plan) => (
              <div key={plan.id} className={`rounded-xl border p-4 ${currentPlan === plan.id ? 'border-[#f26522] bg-[#f26522]/5' : 'border-[#e5e7eb]'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{plan.name}</span>
                  <span className="text-lg font-bold">{plan.price}</span>
                </div>
                <ul className="space-y-1 mb-4">
                  {plan.features.map((f, i) => (
                    <li key={i} className="text-xs text-[#6b7280]">✓ {f}</li>
                  ))}
                </ul>
                <button className={`w-full rounded-lg py-2 text-sm font-medium ${
                  currentPlan === plan.id 
                    ? 'bg-[#f3f4f6] text-[#6b7280] cursor-default'
                    : 'bg-[#0a0a0a] text-white hover:bg-[#1a1a1a]'
                }`}>
                  {currentPlan === plan.id ? 'Current' : 'Upgrade'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* About */}
        <div>
          <h3 className="text-sm font-medium text-[#0a0a0a] mb-3">About</h3>
          <div className="rounded-xl border border-[#e5e7eb] bg-[#fafafa] p-4">
            <p className="text-sm text-[#6b7280]">
              <span className="font-medium text-[#0a0a0a]">Rube</span> — Connect anything to anything
            </p>
            <p className="text-xs text-[#9ca3af] mt-1">Powered by OpenRouter, Composio & Stripe</p>
          </div>
        </div>
      </div>
    </div>
  );
}
