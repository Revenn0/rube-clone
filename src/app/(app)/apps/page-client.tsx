'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { APPS, TOOL_COUNT } from '@/lib/apps';
import { Search, LayoutGrid, List, ExternalLink, Check, Loader2, RefreshCw, Wrench, Settings, Filter } from 'lucide-react';
import {
  ALL_CATEGORY,
  CANONICAL_CATEGORIES,
  normalizeCategoryName,
  isFeaturedSlug,
} from '@/lib/app-categories';
import { isKnownUnsupportedToolkit } from '@/lib/composio-unsupported';
import { CategoryFilterPanel } from '@/components/apps/category-filter-panel';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/lib/toast';

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
  authorizeUnsupported?: boolean;
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
        <div className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 ring-2 ring-background shadow-sm">
          <Check className="h-3 w-3 text-white" strokeWidth={2.5} />
        </div>
      )}
    </div>
  );
}

export default function AppsPageClient() {
  const { addToast } = useToast();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'my-apps' | 'marketplace'>('marketplace');
  const [category, setCategory] = useState<string>(ALL_CATEGORY);
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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
      if (search) params.set('search', search);
      const res = await fetch(`/api/composio/toolkits?${params}`);
      if (!res.ok) {
        addToast('Failed to load apps. Please try again.', 'error');
        return;
      }
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
      } else if (!append) {
        setMarketplaceApps([]);
      }
      setHasMore(data.hasMore ?? false);
    } catch {
      addToast('Failed to load apps. Please check your connection.', 'error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setOffset(0);
    loadPage(0);
  }, [loadPage]);

  useEffect(() => {
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

      if (data.unsupported) {
        addToast(
          data.error || 'This app does not support browser connection. It may still work from chat.',
          'info'
        );
        setConnecting(null);
        return;
      }

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
      } else if (data.error) {
        addToast(
          data.detail ? `${data.error} (${data.detail})` : data.error,
          'error'
        );
        setConnecting(null);
      }
    } catch {
      addToast('Failed to connect app. Please try again.', 'error');
      setConnecting(null);
    }
  };

  const handleDisconnect = async (appId: string, connectedAccountId?: string) => {
    try {
      const res = await fetch('/api/composio/connections/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectedAccountId: connectedAccountId || '', appId }),
      });
      if (!res.ok) {
        addToast('Failed to disconnect app. Please try again.', 'error');
        return;
      }
      addToast('App disconnected successfully.', 'success');
      loadData();
    } catch {
      addToast('Failed to disconnect app. Please try again.', 'error');
    }
  };

  type DisplayApp = {
    id: string;
    name: string;
    description: string;
    category: string;
    canonicalCategory: string;
    isFeatured: boolean;
    authorizeUnsupported: boolean;
    logo: string;
    tools_count: number;
    isConnected: boolean;
    connectedAccountId?: string;
  };

  const baseApps: DisplayApp[] = useMemo(
    () =>
      marketplaceApps.length > 0
        ? marketplaceApps.map((t) => {
            const rawCat = t.categories?.[0]?.name;
            const canonical = normalizeCategoryName(rawCat, t.slug, t.name);
            const featured = isFeaturedSlug(t.slug, t.tools_count);
            const unsupported =
              t.authorizeUnsupported ?? isKnownUnsupportedToolkit(t.slug);
            return {
              id: t.slug,
              name: t.name,
              description: t.description,
              category: rawCat ?? canonical,
              canonicalCategory: canonical,
              isFeatured: featured,
              authorizeUnsupported: unsupported,
              logo: t.logo,
              tools_count: t.tools_count,
              isConnected: t.isConnected,
              connectedAccountId: t.connectedAccountId,
            };
          })
        : APPS.map((a) => {
            const canonical = normalizeCategoryName(a.category, a.id, a.name);
            const tc = TOOL_COUNT[a.id] ?? 0;
            return {
              id: a.id,
              name: a.name,
              description: a.description,
              category: a.category,
              canonicalCategory: canonical,
              isFeatured: isFeaturedSlug(a.id, tc),
              authorizeUnsupported: isKnownUnsupportedToolkit(a.id),
              logo: '',
              tools_count: tc,
              isConnected: isConnected(a.id),
              connectedAccountId: connections.find((c) => c.appId === a.id)?.connectedAccountId,
            };
          }),
    [marketplaceApps, connections]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of CANONICAL_CATEGORIES) counts[c] = 0;
    counts[ALL_CATEGORY] = baseApps.length;
    counts.Featured = baseApps.filter((a) => a.isFeatured).length;
    for (const app of baseApps) {
      const c = app.canonicalCategory;
      if (counts[c] !== undefined) counts[c]++;
      else counts['Other / Miscellaneous'] = (counts['Other / Miscellaneous'] ?? 0) + 1;
    }
    return counts;
  }, [baseApps]);

  let filteredApps = baseApps;
  if (category !== ALL_CATEGORY) {
    if (category === 'Featured') {
      filteredApps = filteredApps.filter((app) => app.isFeatured);
    } else {
      filteredApps = filteredApps.filter((app) => app.canonicalCategory === category);
    }
  }
  if (tab === 'my-apps') {
    filteredApps = filteredApps.filter((app) => app.isConnected);
  }

  const connectedCount = connections.filter((c) => c.status === 'active').length;

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Apps
              {marketplaceApps.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({marketplaceApps.length}{hasMore ? '+' : ''})
                </span>
              )}
            </h2>
            <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-0.5">
              <button
                onClick={() => setTab('my-apps')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  tab === 'my-apps' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                My Apps
              </button>
              <button
                onClick={() => setTab('marketplace')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  tab === 'marketplace' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Marketplace
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileCategoryOpen(true)}
              className="lg:hidden flex items-center gap-2 h-9 shrink-0 rounded-lg border border-border bg-card px-3 text-sm text-foreground"
            >
              <Filter className="h-4 w-4 shrink-0" />
              <span className="truncate max-w-[9rem] text-left">{category}</span>
            </button>
            <div className="relative flex-1 min-w-[120px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search apps"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>
            <button onClick={loadData} className="p-2 rounded-lg hover:bg-muted text-muted-foreground" title="Refresh">
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            </button>
            <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={cn('p-1.5 rounded-md transition-colors', viewMode === 'grid' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground')}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn('p-1.5 rounded-md transition-colors', viewMode === 'list' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground')}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {mobileCategoryOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            aria-label="Close categories"
            onClick={() => setMobileCategoryOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[min(70vh,520px)] overflow-hidden rounded-t-2xl border border-border bg-card shadow-xl lg:hidden flex flex-col">
            <div className="shrink-0 border-b border-border px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Filter by category</span>
              <button
                type="button"
                className="text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setMobileCategoryOpen(false)}
              >
                Done
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-2">
              <CategoryFilterPanel
                value={category}
                onChange={(c) => {
                  setCategory(c);
                  setMobileCategoryOpen(false);
                }}
                counts={categoryCounts}
                className="border-0 shadow-none bg-transparent"
              />
            </div>
          </div>
        </>
      )}

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-card/40 overflow-y-auto">
          <div className="p-3 sticky top-0">
            <CategoryFilterPanel
              value={category}
              onChange={setCategory}
              counts={categoryCounts}
              className="border-0 shadow-none bg-transparent w-full"
            />
          </div>
        </aside>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6"
      >
        {filteredApps.length === 0 ? (
          tab === 'my-apps' ? (
            <EmptyState
              icon={<LayoutGrid className="h-12 w-12" />}
              title="No apps connected"
              description="Connect apps from the Marketplace to see them here"
              action={{ label: 'Browse Marketplace', onClick: () => setTab('marketplace') }}
            />
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">No apps match your search</div>
          )
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredApps.map((app, index) => {
              const connected = app.isConnected;
              const isConnecting = connecting === app.id;
              return (
                <div
                  key={app.connectedAccountId ? `${app.id}-${app.connectedAccountId}` : `${app.id}-${index}`}
                  className={cn(
                    'group relative flex flex-col items-center rounded-2xl border p-5 transition-all duration-300 cursor-pointer overflow-hidden',
                    connected
                      ? 'border-green-400/60 bg-green-50/80 dark:bg-green-950/20 dark:border-green-700/50 shadow-[0_4px_20px_rgba(34,197,94,0.1)]'
                      : 'border-border/60 bg-card/60 backdrop-blur-md hover:border-brand/50 hover:shadow-lg'
                  )}
                  onClick={() => {
                    if (app.authorizeUnsupported) {
                      addToast('This app does not support browser connection. It may still work from chat.', 'info');
                      return;
                    }
                    if (!connected) handleConnect(app.id);
                  }}
                >
                  {/* Spotlight hover effect (CSS only via group-hover opacity) */}
                  {!connected && (
                    <div className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(ellipse_at_top,_rgba(242,101,34,0.15)_0%,_transparent_70%)]" />
                  )}
                  
                  <div className="relative z-10 flex flex-col items-center w-full">
                    <AppIcon appId={app.id} className="h-16 w-16 mb-4 drop-shadow-md transition-transform duration-300 group-hover:scale-110" showCheck={connected} logo={app.logo || undefined} />
                    <span className="text-sm font-bold text-foreground text-center leading-tight tracking-wide">{app.name}</span>
                    
                    <div className="h-10 flex items-center justify-center mt-1 w-full">
                      {connected ? (
                        <span className="text-[10px] font-black uppercase tracking-widest text-green-600 dark:text-green-400 flex items-center gap-1.5 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Connected
                        </span>
                      ) : app.tools_count > 0 ? (
                        <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/80 bg-muted/50 px-2.5 py-1 rounded-full">
                          <Wrench className="h-3 w-3" /> {app.tools_count} tools
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-3 flex flex-col items-center gap-1 w-full opacity-80 group-hover:opacity-100 transition-opacity">
                      {connected ? (
                        <div className="flex items-center justify-center gap-3 w-full pt-2 border-t border-border/50">
                          <Link
                            href={`/apps/${app.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[11px] font-bold uppercase tracking-wider text-foreground hover:text-brand transition-colors"
                          >
                            Manage
                          </Link>
                          <span className="w-1 h-1 rounded-full bg-border" />
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDisconnect(app.id, app.connectedAccountId); }}
                            className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-destructive transition-colors"
                          >
                            Disconnect
                          </button>
                        </div>
                      ) : isConnecting ? (
                        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-brand">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Connecting...
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 group-hover:text-brand transition-colors">
                          Click to connect
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredApps.map((app, index) => {
              const connected = app.isConnected;
              const isConnecting = connecting === app.id;
              return (
                <div
                  key={app.connectedAccountId ? `${app.id}-${app.connectedAccountId}` : `${app.id}-${index}`}
                  className={cn(
                    'flex items-center justify-between rounded-xl border px-4 py-3 transition-all',
                    connected
                      ? 'border-green-500 bg-green-50 ring-2 ring-green-200/90 dark:bg-green-950/35 dark:ring-green-700/50'
                      : 'border-border bg-card hover:border-brand/30 hover:bg-card-hover cursor-pointer'
                  )}
                  onClick={() => {
                    if (app.authorizeUnsupported) {
                      addToast(
                        'This app does not support browser connection. It may still work from chat.',
                        'info'
                      );
                      return;
                    }
                    if (!connected) handleConnect(app.id);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <AppIcon appId={app.id} className="h-10 w-10" showCheck={connected} logo={app.logo || undefined} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{app.name}</p>
                      <p className="text-xs text-muted-foreground">{app.description}</p>
                    </div>
                    {app.tools_count > 0 && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
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
                          className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-card-hover"
                        >
                          <Settings className="h-3 w-3" /> Manage
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDisconnect(app.id, app.connectedAccountId);
                          }}
                          className="text-xs text-muted-foreground hover:text-red-600"
                        >
                          Disconnect
                        </button>
                      </>
                    ) : isConnecting ? (
                      <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" /> Connecting...
                      </span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConnect(app.id);
                        }}
                        className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-hover transition-colors"
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
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
