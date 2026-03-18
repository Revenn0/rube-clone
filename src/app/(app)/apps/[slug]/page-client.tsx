'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Wrench,
  Settings,
  Download,
  Loader2,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import EditScopesModal from '@/components/apps/edit-scopes-modal';
import ImportConfigModal from '@/components/apps/import-config-modal';

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

function AppIcon({ appId, className }: { appId: string; className?: string }) {
  const iconFile = APP_ICON_FILES[appId] || `${appId}.svg`;
  const iconUrl = `/logos/${iconFile}`;

  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-2xl overflow-hidden bg-white border border-[#e5e7eb]',
        className
      )}
    >
      <img
        src={iconUrl}
        alt=""
        className="w-full h-full object-contain p-2"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          target.parentElement!.innerHTML = `<span class="text-2xl">📦</span>`;
        }}
      />
    </div>
  );
}

interface AppDetail {
  app: { id: string; name: string; description: string; category: string };
  connection: {
    isConnected: boolean;
    connectedAccountId: string | null;
    connectedAt: string | null;
  };
  toolCount: number;
  scopes: string[];
  composioVerified: boolean;
}

export default function AppDetailClient({ slug }: { slug: string }) {
  const [data, setData] = useState<AppDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [editScopesOpen, setEditScopesOpen] = useState(false);
  const [importConfigOpen, setImportConfigOpen] = useState(false);

  useEffect(() => {
    loadDetail();
  }, [slug]);

  const loadDetail = async () => {
    try {
      const res = await fetch(`/api/composio/apps/${slug}`);
      if (!res.ok) {
        setData(null);
        return;
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to load app detail:', err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!data?.connection.connectedAccountId) return;
    setDisconnecting(true);
    try {
      await fetch('/api/composio/connections/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectedAccountId: data.connection.connectedAccountId,
          appId: data.app.id,
        }),
      });
      loadDetail();
    } catch (err) {
      console.error('Disconnect failed:', err);
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#9ca3af]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center gap-4">
        <p className="text-[#6b7280]">App not found</p>
        <Link
          href="/apps"
          className="flex items-center gap-2 text-sm font-medium text-[#0a0a0a] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Marketplace
        </Link>
      </div>
    );
  }

  const { app, connection, toolCount, scopes, composioVerified } = data;
  const connectedAtFormatted = connection.connectedAt
    ? new Date(connection.connectedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div className="min-h-full flex flex-col">
      <div className="border-b border-[#e5e7eb] px-4 sm:px-6 py-4">
        <Link
          href="/apps"
          className="inline-flex items-center gap-2 text-sm text-[#6b7280] hover:text-[#0a0a0a] mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Marketplace
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <AppIcon appId={app.id} className="h-16 w-16 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-[#0a0a0a]">{app.name}</h1>
              {composioVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#f0fdf4] px-2.5 py-0.5 text-xs font-medium text-[#166534]">
                  <Shield className="h-3 w-3" /> Composio Verified
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-[#6b7280]">{app.description}</p>
            {connection.isConnected && connectedAtFormatted && (
              <p className="mt-2 text-sm font-medium text-green-600">
                ENABLED ON {connectedAtFormatted.toUpperCase()}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 sm:px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-4 py-4">
            <Wrench className="h-5 w-5 text-[#9ca3af]" />
            <div>
              <p className="text-xs text-[#6b7280]">Tools</p>
              <p className="text-lg font-semibold text-[#0a0a0a]">{toolCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-4 py-4">
            <Check className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-xs text-[#6b7280]">Connected accounts</p>
              <p className="text-lg font-semibold text-[#0a0a0a]">
                {connection.isConnected ? '1' : '0'}
              </p>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-4">
          <h3 className="text-sm font-medium text-[#0a0a0a] mb-3">Connection Status</h3>
          {connection.isConnected ? (
            <div className="flex items-center gap-2 text-green-600">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium">Connection Enabled</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[#6b7280]">
              <div className="h-2 w-2 rounded-full bg-[#d1d5db]" />
              <span className="text-sm">Not connected</span>
            </div>
          )}

          {connection.isConnected && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setEditScopesOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm font-medium text-[#0a0a0a] hover:bg-[#f9fafb]"
              >
                <Settings className="h-4 w-4" /> Edit Scopes
              </button>
              <button
                onClick={() => setImportConfigOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm font-medium text-[#0a0a0a] hover:bg-[#f9fafb]"
              >
                <Download className="h-4 w-4" /> Import Config
              </button>
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
              >
                {disconnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Disconnect'
                )}
              </button>
            </div>
          )}
        </div>

        {/* Scopes */}
        {scopes.length > 0 && (
          <div className="rounded-xl border border-[#e5e7eb] bg-white p-4">
            <h3 className="text-sm font-medium text-[#0a0a0a] mb-3">Scopes</h3>
            <ul className="space-y-2">
              {scopes.map((scope) => (
                <li
                  key={scope}
                  className="flex items-center gap-2 text-sm text-[#6b7280]"
                >
                  <Check className="h-4 w-4 shrink-0 text-green-600" />
                  <code className="break-all text-xs">{scope}</code>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <EditScopesModal
        open={editScopesOpen}
        onOpenChange={setEditScopesOpen}
        appId={app.id}
        appName={app.name}
        scopes={scopes}
        connectedAccountId={connection.connectedAccountId}
        onUpdated={loadDetail}
      />
      <ImportConfigModal
        open={importConfigOpen}
        onOpenChange={setImportConfigOpen}
        appName={app.name}
      />
    </div>
  );
}
