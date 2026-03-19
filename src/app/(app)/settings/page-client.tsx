'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { User, CreditCard, Key, Users, Activity, Settings, LogOut, Trash2, Loader2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';
import { PLANS, getPlanIds, type PlanId } from '@/lib/plans';
import { useToast } from '@/lib/toast';

type SettingsTab = 'account' | 'billing' | 'api-keys' | 'team' | 'activity';

const TABS: { id: SettingsTab; label: string; icon: typeof User }[] = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'billing', label: 'Billing & Usage', icon: CreditCard },
  { id: 'api-keys', label: 'API Keys', icon: Key },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'activity', label: 'Activity', icon: Activity },
];

interface ActivityLog {
  id: string;
  action: string;
  details?: string;
  createdAt: string;
  credits?: number;
}

interface BillingData {
  planId: string;
  plan: { id: string; name: string; price: number; executionsLimit: number; features: string[] };
  usage: number;
  subscription: { status: string; currentPeriodEnd?: string; cancelAtPeriodEnd?: boolean } | null;
}

export default function SettingsPageClient() {
  const { user } = useUser();
  const { addToast } = useToast();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<SettingsTab>('account');
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    const t = searchParams.get('tab') as SettingsTab | null;
    if (t && TABS.some((x) => x.id === t)) setTab(t);
  }, [searchParams]);

  useEffect(() => {
    if (tab === 'activity') {
      setLoading(true);
      fetch('/api/activity')
        .then((r) => r.json())
        .then((d) => setActivityLogs(d.logs ?? []))
        .catch(() => {
          addToast('Failed to load activity logs.', 'error');
          setActivityLogs([]);
        })
        .finally(() => setLoading(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const fetchBilling = useCallback(() => {
    if (tab !== 'billing') return;
    setBillingLoading(true);
    fetch('/api/billing')
      .then((r) => r.json())
      .then((d) => setBillingData(d))
      .catch(() => {
        addToast('Failed to load billing information.', 'error');
        setBillingData(null);
      })
      .finally(() => setBillingLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  return (
    <div className="min-h-full flex flex-col lg:flex-row">
      {/* Mobile: horizontal scrollable tabs */}
      <div className="lg:hidden border-b border-border bg-card px-4 pt-4 pb-0">
        <h1 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Settings
        </h1>
        <div className="flex gap-1 overflow-x-auto pb-0 scrollbar-none -mx-4 px-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-sm font-medium border-b-2 transition-colors shrink-0',
                tab === t.id
                  ? 'border-brand text-brand'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <t.icon className="h-3.5 w-3.5 shrink-0" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop: vertical sidebar */}
      <div className="hidden lg:block w-64 shrink-0 border-r border-border/50 bg-card/30 p-5">
        <h1 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60 mb-6 flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Settings
        </h1>
        <nav className="space-y-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-brand',
                tab === t.id ? 'bg-brand/10 text-brand shadow-sm' : 'text-muted-foreground hover:bg-card hover:text-foreground hover:shadow-sm'
              )}
            >
              <t.icon className={cn('h-4 w-4 shrink-0', tab === t.id && 'text-brand')} />
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
        <div className="mx-auto max-w-3xl">
          {tab === 'account' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-6 sm:p-8 shadow-sm transition-all hover:shadow-md">
                <h2 className="text-lg font-bold text-foreground mb-6">Profile</h2>
                <div className="flex items-center gap-5">
                  {user?.imageUrl ? (
                    <img src={user.imageUrl} alt="" className="h-20 w-20 rounded-full object-cover ring-4 ring-background shadow-md" />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-brand to-brand-hover flex items-center justify-center text-3xl font-bold text-white shadow-md ring-4 ring-background">
                      {user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0] ?? 'U'}
                    </div>
                  )}
                  <div>
                    <p className="text-xl font-bold text-foreground tracking-tight">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground font-medium mt-1">{user?.emailAddresses?.[0]?.emailAddress}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-6 sm:p-8 shadow-sm transition-all hover:shadow-md">
                <h2 className="text-lg font-bold text-foreground mb-6">Preferences</h2>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Timezone</label>
                  <select className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-brand focus:border-transparent transition-all shadow-sm">
                    <option value="Europe/London">Europe/London (GMT+0)</option>
                    <option value="America/Sao_Paulo">America/São Paulo (GMT-3)</option>
                    <option value="America/New_York">America/New York (GMT-5)</option>
                    <option value="UTC">UTC</option>
                  </select>
                  <p className="text-xs text-muted-foreground/70 mt-2 font-medium">Current time: {new Date().toLocaleString()}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-6 sm:p-8 shadow-sm transition-all hover:shadow-md">
                <h2 className="text-lg font-bold text-foreground mb-6">System</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-border/50">
                    <span className="text-sm font-medium text-foreground">Need Help? Contact Support</span>
                    <a href="mailto:support@jungor.dev" className="rounded-lg bg-brand px-4 py-2 text-xs font-bold text-white hover:scale-105 active:scale-95 transition-all shadow-md shadow-brand/20">
                      Contact Us
                    </a>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-border/50">
                    <span className="text-sm font-medium text-muted-foreground">Signed in as <span className="text-foreground">{user?.emailAddresses?.[0]?.emailAddress}</span></span>
                    <Link href="/sign-out" className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-4 py-2 text-xs font-bold text-foreground hover:bg-muted transition-all shadow-sm">
                      <LogOut className="h-3.5 w-3.5" /> Sign Out
                    </Link>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 sm:p-8">
                <h2 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                  <Trash2 className="h-5 w-5" /> Danger Zone
                </h2>
                <p className="text-sm text-red-600/70 dark:text-red-400/70 mb-4 font-medium">Permanently delete this team and all its data. This action cannot be undone.</p>
                <button className="text-sm font-bold text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 px-4 py-2 rounded-lg transition-colors border border-red-500/20">Delete Team</button>
              </div>
            </div>
          )}

          {tab === 'billing' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-6 sm:p-8 shadow-sm">
                <h2 className="text-sm font-medium text-foreground mb-4">Monthly Usage</h2>
                {billingLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                  </div>
                ) : billingData ? (
                  <div className="space-y-2">
                    {(() => {
                      const used = billingData.usage;
                      const limit = billingData.plan.executionsLimit;
                      const displayLimit = limit < 0 ? 99999 : limit;
                      const pct = limit < 0 ? 0 : Math.min(100, (used / limit) * 100);
                      const barColor =
                        pct >= 95 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-brand';
                      return (
                        <>
                          <div className="h-2.5 w-full rounded-full bg-border overflow-hidden">
                            <div
                              className={cn('h-full rounded-full transition-all duration-300', barColor)}
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                          <p
                            className={cn(
                              'text-sm',
                              pct >= 95 ? 'text-red-600 font-medium' : pct >= 80 ? 'text-amber-600' : 'text-muted-foreground'
                            )}
                          >
                            {used.toLocaleString()} of {displayLimit < 99999 ? displayLimit.toLocaleString() : 'unlimited'}{' '}
                            executions used this month
                          </p>
                          {pct >= 80 && limit < 99999 && (
                            <p className="text-xs text-amber-600">
                              Approaching limit. Upgrade to continue using Jungor.
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Could not load usage data.</p>
                )}
              </div>

              {billingData?.subscription?.status === 'active' && billingData.planId !== 'free' && (
                <div className="rounded-xl border border-border bg-card p-6">
                  <h2 className="text-sm font-medium text-foreground mb-4">Subscription</h2>
                  <p className="text-sm text-muted-foreground mb-3">
                    Manage your subscription, payment method, or cancel.
                  </p>
                  <button
                    onClick={async () => {
                      setPortalLoading(true);
                      try {
                        const res = await fetch('/api/billing/portal', { method: 'POST' });
                        const data = await res.json();
                        if (data.url) window.location.href = data.url;
                        else addToast(data.error || 'Failed to open billing portal.', 'error');
                      } catch {
                        addToast('Failed to open billing portal.', 'error');
                      } finally {
                        setPortalLoading(false);
                      }
                    }}
                    disabled={portalLoading}
                    className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover transition-colors disabled:opacity-50"
                  >
                    {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                    Manage subscription
                  </button>
                </div>
              )}

              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="text-sm font-medium text-foreground mb-4">Plans</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {getPlanIds().map((planId) => {
                    const plan = PLANS[planId];
                    const isCurrent = billingData?.planId === planId;
                    const canUpgrade = planId !== 'free' && plan.stripePriceId && !isCurrent;
                    return (
                      <div
                        key={planId}
                        className={cn(
                          'rounded-xl border p-4',
                          isCurrent
                            ? 'border-2 border-brand bg-gradient-to-br from-orange-50/50 to-pink-50/50'
                            : 'border-border'
                        )}
                      >
                        <button
                          disabled
                          className={cn(
                            'w-full rounded-lg py-2 text-xs font-medium mb-3',
                            isCurrent ? 'bg-brand text-white' : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {isCurrent ? 'Current plan' : plan.name}
                        </button>
                        <p className="font-semibold text-foreground mb-1">{plan.name}</p>
                        <p className="text-2xl font-bold text-foreground mb-2">
                          ${plan.price}{' '}
                          <span className="text-sm font-normal text-muted-foreground">
                            /{plan.price === 0 ? 'forever' : 'mo'}
                          </span>
                        </p>
                        <ul className="space-y-1 text-xs text-muted-foreground mb-4">
                          {plan.features.slice(0, 4).map((f, i) => (
                            <li key={i}>• {f}</li>
                          ))}
                        </ul>
                        {canUpgrade && (
                          <button
                            onClick={async () => {
                              setCheckoutLoading(planId);
                              try {
                                const res = await fetch('/api/billing', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ planId }),
                                });
                                const data = await res.json();
                                if (data.url) window.location.href = data.url;
                                else addToast(data.error || 'Failed to start checkout. Please try again.', 'error');
                              } catch {
                                addToast('Failed to start checkout. Please try again.', 'error');
                              } finally {
                                setCheckoutLoading(null);
                              }
                            }}
                            disabled={!!checkoutLoading}
                            className="w-full rounded-lg bg-brand py-2 text-xs font-medium text-white hover:bg-brand-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                          >
                            {checkoutLoading === planId ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              'Upgrade'
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === 'api-keys' && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-sm font-medium text-foreground mb-4">API Keys</h2>
              <p className="text-sm text-muted-foreground mb-4">Manage your API keys for programmatic access.</p>
              <p className="text-xs text-muted-foreground">No API keys created yet.</p>
            </div>
          )}

          {tab === 'team' && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-sm font-medium text-foreground mb-4">Team</h2>
              <p className="text-sm text-muted-foreground mb-4">Invite team members to collaborate.</p>
              <p className="text-xs text-muted-foreground">You are on the Free plan. Upgrade to add team members.</p>
            </div>
          )}

          {tab === 'activity' && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="text-sm font-medium text-foreground">Usage Activity</h2>
                <a href="https://docs.composio.dev" target="_blank" rel="noopener noreferrer" className="text-xs text-brand hover:underline">Learn more</a>
              </div>
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : activityLogs.length === 0 ? (
                <EmptyState
                  icon={<Activity className="h-12 w-12" />}
                  title="No activity yet"
                  description="Your usage activity will appear here"
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-muted">
                        <th className="px-4 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Details</th>
                        <th className="px-4 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                        <th className="px-4 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Credits</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {activityLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-card-hover">
                          <td className="px-4 py-3 text-foreground">{log.action}</td>
                          <td className="px-4 py-3 text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</td>
                          <td className="px-4 py-3 text-red-600">{log.credits != null ? `-${log.credits}` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
