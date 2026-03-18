'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { User, CreditCard, Key, Users, Activity, Settings, LogOut, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export default function SettingsPageClient() {
  const { user } = useUser();
  const [tab, setTab] = useState<SettingsTab>('account');
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab === 'activity') {
      setLoading(true);
      fetch('/api/activity')
        .then((r) => r.json())
        .then((d) => setActivityLogs(d.logs ?? []))
        .catch(() => setActivityLogs([]))
        .finally(() => setLoading(false));
    }
  }, [tab]);

  return (
    <div className="min-h-full flex">
      <div className="w-64 shrink-0 border-r border-[#e5e7eb] bg-white p-4">
        <h1 className="text-lg font-semibold text-[#0a0a0a] mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Settings
        </h1>
        <nav className="space-y-0.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                tab === t.id ? 'bg-[#f3f4f6] text-[#0a0a0a]' : 'text-[#6b7280] hover:bg-[#f9fafb] hover:text-[#0a0a0a]'
              )}
            >
              <t.icon className="h-4 w-4 shrink-0" />
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-8">
        <div className="mx-auto max-w-2xl">
          {tab === 'account' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-[#e5e7eb] bg-white p-6">
                <h2 className="text-sm font-medium text-[#0a0a0a] mb-4">Profile</h2>
                <div className="flex items-center gap-4">
                  {user?.imageUrl ? (
                    <img src={user.imageUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#f26522] to-[#ff8f44] flex items-center justify-center text-2xl font-semibold text-white">
                      {user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0] ?? 'U'}
                    </div>
                  )}
                  <div>
                    <p className="text-base font-medium text-[#0a0a0a]">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-sm text-[#6b7280]">{user?.emailAddresses?.[0]?.emailAddress}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-[#e5e7eb] bg-white p-6">
                <h2 className="text-sm font-medium text-[#0a0a0a] mb-4">Preferences</h2>
                <div>
                  <label className="block text-xs font-medium text-[#6b7280] mb-1">Timezone</label>
                  <select className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2.5 text-sm text-[#0a0a0a]">
                    <option value="Europe/London">Europe/London (GMT+0)</option>
                    <option value="America/Sao_Paulo">America/São Paulo (GMT-3)</option>
                    <option value="America/New_York">America/New York (GMT-5)</option>
                    <option value="UTC">UTC</option>
                  </select>
                  <p className="text-xs text-[#9ca3af] mt-1">Current time: {new Date().toLocaleString()}</p>
                </div>
              </div>
              <div className="rounded-xl border border-[#e5e7eb] bg-white p-6">
                <h2 className="text-sm font-medium text-[#0a0a0a] mb-4">System</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#0a0a0a]">Need Help? Contact Support</span>
                    <a href="mailto:support@rube.dev" className="rounded-lg bg-[#0a0a0a] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1a1a1a]">
                      Contact Us
                    </a>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#6b7280]">Signed in as {user?.emailAddresses?.[0]?.emailAddress}</span>
                    <Link href="/sign-out" className="flex items-center gap-1.5 rounded-lg border border-[#e5e7eb] px-3 py-1.5 text-xs font-medium text-[#0a0a0a] hover:bg-[#f9fafb]">
                      <LogOut className="h-3.5 w-3.5" /> Sair
                    </Link>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-red-200 bg-red-50/30 p-6">
                <h2 className="text-sm font-medium text-red-700 mb-2 flex items-center gap-2">
                  <Trash2 className="h-4 w-4" /> Danger Zone
                </h2>
                <p className="text-xs text-[#6b7280] mb-3">Permanently delete this team and all its data.</p>
                <button className="text-sm font-medium text-red-600 hover:underline">Delete Team</button>
              </div>
            </div>
          )}

          {tab === 'billing' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-[#e5e7eb] bg-white p-6">
                <h2 className="text-sm font-medium text-[#0a0a0a] mb-4">Credit Usage</h2>
                <div className="space-y-2">
                  <div className="h-2.5 w-full rounded-full bg-[#e5e7eb] overflow-hidden">
                    <div className="h-full w-[10%] rounded-full bg-[#f26522]" />
                  </div>
                  <p className="text-sm text-[#6b7280]">4,501 of 5,000 credits remaining</p>
                  <p className="text-xs text-[#9ca3af]">Initial: 4,501 credits • Never expires</p>
                </div>
              </div>
              <div className="rounded-xl border border-[#e5e7eb] bg-white p-6">
                <h2 className="text-sm font-medium text-[#0a0a0a] mb-4">Upgrade your plan</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-[#e5e7eb] p-4">
                    <button disabled className="w-full rounded-lg bg-[#f3f4f6] py-2 text-[10px] font-medium text-[#6b7280] mb-3">Current Plan</button>
                    <p className="font-semibold text-[#0a0a0a] mb-1">Something for Everyone</p>
                    <p className="text-2xl font-bold text-[#0a0a0a] mb-2">$0 <span className="text-sm font-normal text-[#6b7280]">/forever</span></p>
                    <ul className="space-y-1 text-xs text-[#6b7280]">
                      <li>• Access to basic apps</li>
                      <li>• One time 5,000 credits</li>
                      <li>• Perfect for personal use</li>
                    </ul>
                  </div>
                  <div className="rounded-xl border-2 border-[#f26522] bg-gradient-to-br from-orange-50 to-pink-50 p-4">
                    <button className="w-full rounded-lg bg-[#0a0a0a] py-2 text-[10px] font-medium text-white hover:bg-[#1a1a1a] mb-3">Upgrade To Pro</button>
                    <p className="font-semibold text-[#0a0a0a] mb-1">Anything for Pros</p>
                    <p className="text-2xl font-bold text-[#0a0a0a] mb-2">$25 <span className="text-sm font-normal text-[#6b7280]">/mo</span></p>
                    <ul className="space-y-1 text-xs text-[#6b7280]">
                      <li>• Full access to 600+ apps</li>
                      <li>• 25,000 credits per month</li>
                      <li>• Shared setup for small teams</li>
                      <li>• Priority support</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'api-keys' && (
            <div className="rounded-xl border border-[#e5e7eb] bg-white p-6">
              <h2 className="text-sm font-medium text-[#0a0a0a] mb-4">API Keys</h2>
              <p className="text-sm text-[#6b7280] mb-4">Manage your API keys for programmatic access.</p>
              <p className="text-xs text-[#9ca3af]">No API keys created yet.</p>
            </div>
          )}

          {tab === 'team' && (
            <div className="rounded-xl border border-[#e5e7eb] bg-white p-6">
              <h2 className="text-sm font-medium text-[#0a0a0a] mb-4">Team</h2>
              <p className="text-sm text-[#6b7280] mb-4">Invite team members to collaborate.</p>
              <p className="text-xs text-[#9ca3af]">You are on the Free plan. Upgrade to add team members.</p>
            </div>
          )}

          {tab === 'activity' && (
            <div className="rounded-xl border border-[#e5e7eb] bg-white overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb]">
                <h2 className="text-sm font-medium text-[#0a0a0a]">Usage Activity</h2>
                <a href="https://docs.composio.dev" target="_blank" rel="noopener noreferrer" className="text-xs text-[#f26522] hover:underline">Learn more</a>
              </div>
              {loading ? (
                <div className="p-8 text-center text-sm text-[#9ca3af]">Loading...</div>
              ) : activityLogs.length === 0 ? (
                <div className="p-8 text-center text-sm text-[#9ca3af]">No activity yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-[#f3f4f6]">
                        <th className="px-4 py-4 text-left text-xs font-medium text-[#6b7280] uppercase">Details</th>
                        <th className="px-4 py-4 text-left text-xs font-medium text-[#6b7280] uppercase">Date</th>
                        <th className="px-4 py-4 text-left text-xs font-medium text-[#6b7280] uppercase">Credits</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5e7eb]">
                      {activityLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-[#f9fafb]">
                          <td className="px-4 py-3 text-[#0a0a0a]">{log.action}</td>
                          <td className="px-4 py-3 text-[#6b7280]">{new Date(log.createdAt).toLocaleString()}</td>
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
