'use client';

import { useState, useEffect } from 'react';
import { APPS } from '@/lib/apps';
import { Search, LayoutGrid, List, ExternalLink, Check, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Connection {
  appId: string;
  status: string;
  connectedAt: string | null;
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

export default function AppsPageClient() {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConnections();
    // Refresh every 10 seconds to catch new connections
    const interval = setInterval(loadConnections, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadConnections = async () => {
    try {
      const res = await fetch('/api/composio/auth');
      const data = await res.json();
      if (data.connections) setConnections(data.connections);
    } catch (err) {
      console.error('Failed to load connections:', err);
    } finally {
      setLoading(false);
    }
  };

  const isConnected = (appId: string) => connections.some(c => c.appId === appId && c.status === 'active');

  const handleConnect = async (appId: string) => {
    setConnecting(appId);
    try {
      const res = await fetch('/api/composio/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId }),
      });
      const data = await res.json();

      if (data.connected) {
        // Already connected
        loadConnections();
        setConnecting(null);
        return;
      }

      if (data.url) {
        // Open OAuth
        const popup = window.open(data.url, '_blank', 'width=600,height=700');

        // Poll for completion
        const checkInterval = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkInterval);
            loadConnections();
            setConnecting(null);
          }
        }, 2000);

        // Auto-check after 15 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          loadConnections();
          setConnecting(null);
        }, 15000);
      }
    } catch (err) {
      console.error('Connect failed:', err);
      setConnecting(null);
    }
  };

  const filteredApps = APPS.filter(
    (app) =>
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-full flex flex-col">
      <div className="border-b border-[#e5e7eb] px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[#0a0a0a]">
            All Apps
            <span className="ml-2 text-sm font-normal text-[#9ca3af]">
              {connections.filter(c => c.status === 'active').length} connected
            </span>
          </h2>
          <div className="flex items-center gap-2.5">
            <button onClick={loadConnections} className="p-2 rounded-lg hover:bg-[#f3f4f6] text-[#9ca3af]" title="Refresh">
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </button>
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full sm:w-48 rounded-lg border border-[#e5e7eb] bg-white pl-9 pr-3 text-sm text-[#0a0a0a] placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#f26522]/20 focus:border-[#f26522]"
              />
            </div>
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

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filteredApps.map((app) => {
              const connected = isConnected(app.id);
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
                  <div className={cn(
                    'flex h-14 w-14 items-center justify-center rounded-2xl text-2xl mb-3 shadow-sm bg-gradient-to-br',
                    APP_COLORS[app.id] || 'from-gray-400 to-gray-500'
                  )}>
                    {APP_EMOJIS[app.id] || app.icon}
                  </div>
                  <span className="text-sm font-medium text-[#0a0a0a] text-center">{app.name}</span>
                  <div className="mt-2 flex items-center gap-1">
                    {connected ? (
                      <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                        <Check className="h-3 w-3" /> Connected
                      </span>
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
              const connected = isConnected(app.id);
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
                    <div className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-xl text-lg bg-gradient-to-br',
                      APP_COLORS[app.id] || 'from-gray-400 to-gray-500'
                    )}>
                      {APP_EMOJIS[app.id] || app.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#0a0a0a]">{app.name}</p>
                      <p className="text-xs text-[#9ca3af]">{app.description}</p>
                    </div>
                  </div>
                  <div>
                    {connected ? (
                      <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                        <Check className="h-3 w-3" /> Connected
                      </span>
                    ) : isConnecting ? (
                      <span className="flex items-center gap-1.5 rounded-full bg-[#f3f4f6] px-3 py-1 text-xs text-[#9ca3af]">
                        <Loader2 className="h-3 w-3 animate-spin" /> Connecting...
                      </span>
                    ) : (
                      <button className="flex items-center gap-1.5 rounded-lg bg-[#0a0a0a] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1a1a1a]">
                        <ExternalLink className="h-3 w-3" /> Connect
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
