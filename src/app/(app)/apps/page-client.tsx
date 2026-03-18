'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { APPS, TOOL_COUNT } from '@/lib/apps';
import { Search, LayoutGrid, List, ExternalLink, Check, Loader2, RefreshCw, Wrench, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 30;

interface Connection {
  appId: string;
  status: string;
  connectedAt?: string | null;
  connectedAccountId?: string;
}

interface MarketplaceApp {
  slug: string;
  name: string;
  description: string;
  logo: string;
  tools_count: number;
  categories: Array<{ slug?: string; id?: string; name: string }>;
  isConnected: boolean;
  connectedAccountId?: string;
}

const APP_COLORS: Record<string, string> = {
  gmail: 'from-red-400 to-red-500',
  slack: 'from-purple-400 to-pink-500',
  github: 'from-gray-700 to-gray-900',
  notion: 'from-gray-600 to-gray-800',
  google_calendar: 'from-blue-400 to-blue-600',
  linear: 'from-blue-500 to-indigo-600',
  twitter: 'from-sky-400 to-sky-500',
  stripe: 'from-indigo-500 to-purple-600',
  youtube: 'from-red-500 to-red-600',
  discord: 'from-indigo-400 to-purple-500',
  airtable: 'from-orange-400 to-red-400',
  resend: 'from-gray-800 to-black',
};

const APP_EMOJIS: Record<string, string> = {
  gmail: '📧', slack: '💬', github: '🐙', notion: '📝',
  google_calendar: '📅', linear: '📋', twitter: '🐦', stripe: '💳',
  youtube: '▶️', discord: '🎮', airtable: '📊', resend: '✉️',
};

const APP_ICON_FILES: Record<string, string> = {
  gmail: 'gmail.svg',
  slack: 'slack.svg',
  github: 'github.png',
  notion: 'notion.svg',
  google_calendar: 'google-calendar.svg',
  linear: 'linear.png',
  twitter: 'twitter.svg',
  stripe: 'stripe.svg',
  youtube: 'youtube.svg',
  discord: 'discord.svg',
  airtable: 'airtable.svg',
  resend: 'resend.png',
};

function AppIcon({
  appId,
  className,
  showCheck = false,
  logo,
}: {
  appId: string;
  className?: string;
  showCheck?: boolean;
  logo?: string;
}) {
  const iconFile = APP_ICON_FILES[appId] || `${appId}.svg`;
  const iconUrl = logo || `/logos/${iconFile}`;

  return (
    <div className={cn('relative flex items-center justify-center rounded-2xl overflow-hidden', className)}>
      <img
        src={iconUrl}
        alt=""
        className="w-12 h-12 object-contain"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          target.parentElement!.innerHTML = `<span style="font-size:1.5rem">${APP_EMOJIS[appId] || '📦'}</span>`;
        }}
      />
      {showCheck && (
        <div className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#f26522]">
          <Check className="h-2.5 w-2.5 text-white" />
        </div>
      )}
    </div>
  );
}

const DEFAULT_CATEGORIES = ['All', 'Productivity', 'Communication', 'Development', 'Social', 'Finance'];

export default function AppsPageClient() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'my-apps' | 'marketplace'>('marketplace');
  const [category, setCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [marketplaceApps, setMarketplaceApps] = useState<MarketplaceApp[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadPage = useCallback(async (pageOffset: number, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(pageOffset) });
      const res = await fetch(`/api/composio/toolkits?${params}`);
      const data = await res.json();
      if (data.toolkits?.length) {
        setMarketplaceApps((prev) => (append ? [...prev, ...data.toolkits] : data.toolkits));
        setConnections((prev) => {
          const map = new Map(prev.map((c) => [c.appId, c]));
          data.toolkits.forEach((t: MarketplaceApp) => {
            map.set(t.slug, { appId: t.slug, status: t.isConnected ? 'active' : 'disconnected', connectedAccountId: t.connectedAccountId });
          });
          return Array.from(map.values());
        });
      }
      setHasMore(data.hasMore ?? false);
    } catch (err) {
      console.error('Failed to load toolkits:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadPage(0);
    const interval = setInterval(() => loadPage(0), 15000);
    return () => clearInterval(interval);
  }, [loadPage]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || tab === 'my-apps') return;
    const next = marketplaceApps.length;
    setOffset(next);
    loadPage(next, true);
  }, [loadPage, loadingMore, hasMore, marketplaceApps.length, tab]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    if (nearBottom) loadMore();
  }, [loadMore]);

  const loadData = useCallback(() => {
    setOffset(0);
    loadPage(0);
  }, [loadPage]);

  const isConnected = (appId: string) => connections.some(c => c.appId === appId && c.status === 'active');

  const handleConnect = async (appId: string) => {
    setConnecting(appId);
    try {
      const res = await fetch('/api/composio/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolkit: appId }),
      });
      const data = await res.json();

      if (data.redirectUrl) {
        const popup = window.open(data.redirectUrl, '_blank', 'width=600,height=700');

        const checkInterval = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkInterval);
            loadData();
            setConnecting(null);
          }
        }, 2000);

        setTimeout(() => {
          clearInterval(checkInterval);
          loadData();
          setConnecting(null);
        }, 15000);
      }
    } catch (err) {
      console.error('Connect failed:', err);
      setConnecting(null);
    }
  };

  const handleDisconnect = async (appId: string, connectedAccountId?: string) => {
    try {
      await fetch('/api/composio/connections/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectedAccountId: connectedAccountId || '', appId }),
      });
      loadData();
    } catch (err) {
      console.error('Disconnect failed:', err);
    }
  };

  type DisplayApp = {
    id: string;
    name: string;
    description: string;
    category: string;
    logo: string;
    tools_count: number;
    isConnected: boolean;
    connectedAccountId?: string;
  };

  // Marketplace: from /api/composio/toolkits. My Apps: same list filtered by connected. Fallback to APPS when empty.
  const baseApps: DisplayApp[] = marketplaceApps.length > 0
    ? marketplaceApps.map((t) => ({
        id: t.slug,
        name: t.name,
        description: t.description,
        category: t.categories?.[0]?.name ?? 'Other',
        logo: t.logo,
        tools_count: t.tools_count,
        isConnected: t.isConnected,
        connectedAccountId: t.connectedAccountId,
      }))
    : APPS.map((a) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        category: a.category,
        logo: '',
        tools_count: TOOL_COUNT[a.id] ?? 0,
        isConnected: isConnected(a.id),
        connectedAccountId: connections.find((c) => c.appId === a.id)?.connectedAccountId,
      }));

  let filteredApps = baseApps.filter(
    (app) =>
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.description.toLowerCase().includes(search.toLowerCase())
  );
  if (category !== 'All') {
    filteredApps = filteredApps.filter((app) => app.category === category);
  }
  if (tab === 'my-apps') {
    filteredApps = filteredApps.filter((app) => app.isConnected);
  }

  const categories = ['All', ...Array.from(new Set(baseApps.map((a) => a.category).filter(Boolean)))].sort();
  const displayCategories = categories.length > 1 ? categories : DEFAULT_CATEGORIES;
  const connectedCount = connections.filter((c) => c.status === 'active').length;

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <div className="shrink-0 border-b border-[#e5e7eb] px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#0a0a0a]">
              Apps
              {marketplaceApps.length > 0 && (
                <span className="ml-2 text-sm font-normal text-[#9ca3af]">
                  ({marketplaceApps.length}{hasMore ? '+' : ''})
                </span>
              )}
            </h2>
            <div className="flex items-center gap-1 rounded-lg border border-[#e5e7eb] bg-white p-0.5">
              <button
                onClick={() => setTab('my-apps')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  tab === 'my-apps' ? 'bg-[#f3f4f6] text-[#0a0a0a]' : 'text-[#6b7280] hover:text-[#0a0a0a]'
                )}
              >
                My Apps
              </button>
              <button
                onClick={() => setTab('marketplace')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  tab === 'marketplace' ? 'bg-[#f3f4f6] text-[#0a0a0a]' : 'text-[#6b7280] hover:text-[#0a0a0a]'
                )}
              >
                Marketplace
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[120px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
              <input
                type="text"
                placeholder="Search apps"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-lg border border-[#e5e7eb] bg-white pl-9 pr-3 text-sm text-[#0a0a0a] placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#f26522]/20 focus:border-[#f26522]"
              />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-9 rounded-lg border border-[#e5e7eb] bg-white px-3 text-sm text-[#0a0a0a] focus:outline-none focus:ring-2 focus:ring-[#f26522]/20"
            >
              <option value="All">All Categories</option>
              {displayCategories.filter((c) => c !== 'All').map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button onClick={loadData} className="p-2 rounded-lg hover:bg-[#f3f4f6] text-[#9ca3af]" title="Refresh">
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            </button>
            <div className="flex items-center gap-1 rounded-lg border border-[#e5e7eb] bg-white p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={cn('p-1.5 rounded-md transition-colors', viewMode === 'grid' ? 'bg-[#f3f4f6] text-[#0a0a0a]' : 'text-[#9ca3af] hover:text-[#0a0a0a]')}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn('p-1.5 rounded-md transition-colors', viewMode === 'list' ? 'bg-[#f3f4f6] text-[#0a0a0a]' : 'text-[#9ca3af] hover:text-[#0a0a0a]')}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6"
      >
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filteredApps.map((app) => {
              const connected = app.isConnected;
              const isConnecting = connecting === app.id;
              return (
                <div
                  key={app.id}
                  className={cn(
                    'group flex flex-col items-center rounded-xl border p-4 transition-all cursor-pointer',
                    connected ? 'border-green-200 bg-green-50/50' : 'border-[#e5e7eb] bg-white hover:border-[#d1d5db] hover:bg-[#f9fafb]'
                  )}
                  onClick={() => !connected && handleConnect(app.id)}
                >
                  <AppIcon appId={app.id} className="h-14 w-14 mb-3" showCheck={connected} logo={app.logo || undefined} />
                  <span className="text-sm font-medium text-[#0a0a0a] text-center">{app.name}</span>
                  {app.tools_count > 0 && (
                    <span className="flex items-center gap-1 text-xs text-[#9ca3af] mt-1">
                      <Wrench className="h-3 w-3" /> {app.tools_count}
                    </span>
                  )}
                  <div className="mt-2 flex flex-col items-center gap-1">
                    {connected ? (
                      <>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/apps/${app.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs font-medium text-[#0a0a0a] hover:underline"
                          >
                            Manage
                          </Link>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDisconnect(app.id, app.connectedAccountId);
                            }}
                            className="text-xs text-[#9ca3af] hover:text-red-600"
                          >
                            Disconnect
                          </button>
                        </div>
                      </>
                    ) : isConnecting ? (
                      <span className="flex items-center gap-1 text-xs text-[#9ca3af]">
                        <Loader2 className="h-3 w-3 animate-spin" /> Connecting...
                      </span>
                    ) : (
                      <span className="text-xs text-[#9ca3af]">Tap to connect</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredApps.map((app) => {
              const connected = app.isConnected;
              const isConnecting = connecting === app.id;
              return (
                <div
                  key={app.id}
                  className={cn(
                    'flex items-center justify-between rounded-xl border px-4 py-3 transition-all cursor-pointer',
                    connected ? 'border-green-200 bg-green-50/50' : 'border-[#e5e7eb] bg-white hover:border-[#d1d5db] hover:bg-[#f9fafb]'
                  )}
                  onClick={() => !connected && handleConnect(app.id)}
                >
                  <div className="flex items-center gap-3">
                    <AppIcon appId={app.id} className="h-10 w-10" showCheck={connected} logo={app.logo || undefined} />
                    <div>
                      <p className="text-sm font-medium text-[#0a0a0a]">{app.name}</p>
                      <p className="text-xs text-[#9ca3af]">{app.description}</p>
                    </div>
                    {app.tools_count > 0 && (
                      <span className="flex items-center gap-1 text-xs text-[#9ca3af] shrink-0">
                        <Wrench className="h-3 w-3" /> {app.tools_count}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {connected ? (
                      <>
                        <Link
                          href={`/apps/${app.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3 py-1.5 text-xs font-medium text-[#0a0a0a] hover:bg-[#f9fafb]"
                        >
                          <Settings className="h-3 w-3" /> Manage
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDisconnect(app.id, app.connectedAccountId);
                          }}
                          className="text-xs text-[#9ca3af] hover:text-red-600"
                        >
                          Disconnect
                        </button>
                      </>
                    ) : isConnecting ? (
                      <span className="flex items-center gap-1.5 rounded-full bg-[#f3f4f6] px-3 py-1 text-xs text-[#9ca3af]">
                        <Loader2 className="h-3 w-3 animate-spin" /> Connecting...
                      </span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConnect(app.id);
                        }}
                        className="flex items-center gap-1.5 rounded-lg bg-[#0a0a0a] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1a1a1a]"
                      >
                        <ExternalLink className="h-3 w-3" /> Connect
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {loadingMore && (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-[#9ca3af]" />
          </div>
        )}
      </div>
    </div>
  );
}
