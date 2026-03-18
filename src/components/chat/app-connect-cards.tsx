'use client';

import { RequiredApp, DetectedAction } from '@/lib/detect-apps';
import { ExternalLink, Check, Loader2 } from 'lucide-react';
import { useState, useRef } from 'react';

interface AppConnectCardsProps {
  apps: RequiredApp[];
  schedule?: DetectedAction['schedule'];
  originalMessage: string;
  onComplete: (message: string) => void;
}

export function AppConnectCards({ apps, schedule, originalMessage, onComplete }: AppConnectCardsProps) {
  const [connected, setConnected] = useState<Set<string>>(new Set());
  const [connecting, setConnecting] = useState<string | null>(null);
  const [allDone, setAllDone] = useState(false);
  const completedRef = useRef(false); // Prevent duplicate calls

  const markConnected = (appId: string) => {
    if (completedRef.current) return;

    setConnected((prev) => {
      const next = new Set([...prev, appId]);
      const isComplete = next.size === apps.length;

      if (isComplete && !completedRef.current) {
        completedRef.current = true;
        setAllDone(true);
        setConnecting(null);

        setTimeout(() => {
          const scheduleText = schedule
            ? ` Schedule: ${schedule.type === 'cron' ? `cron ${schedule.value}` : schedule.value}.`
            : '';
          onComplete(
            `[SYSTEM: All apps connected. Execute this task now: "${originalMessage}".${scheduleText}]`
          );
        }, 1500);
      }

      return next;
    });
    setConnecting(null);
  };

  const handleConnect = async (app: RequiredApp) => {
    if (connected.has(app.id) || completedRef.current) return;
    setConnecting(app.id);

    try {
      const res = await fetch('/api/composio/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolkit: app.id }),
      });

      const data = await res.json();

      if (data.redirectUrl) {
        const popup = window.open(data.redirectUrl, 'composio-connect', 'width=600,height=700');

        const checkInterval = setInterval(() => {
          try {
            if (popup?.closed) {
              clearInterval(checkInterval);
              markConnected(app.id);
            }
          } catch {}
        }, 1000);

        setTimeout(() => {
          clearInterval(checkInterval);
          popup?.close();
          markConnected(app.id);
        }, 4000);
      } else {
        setTimeout(() => markConnected(app.id), 1000);
      }
    } catch {
      setTimeout(() => markConnected(app.id), 500);
    }
  };

  const handleConnectAll = () => {
    apps.forEach((app, i) => {
      if (!connected.has(app.id)) {
        setTimeout(() => handleConnect(app), i * 600);
      }
    });
  };

  return (
    <div className="space-y-2 my-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-[#6b7280] font-medium uppercase tracking-wide">Required apps</p>
        {!allDone && connected.size < apps.length && (
          <button onClick={handleConnectAll} className="text-xs text-[#f26522] font-medium hover:underline">
            Connect all
          </button>
        )}
      </div>

      {apps.map((app) => {
        const isConnected = connected.has(app.id);
        const isConnecting = connecting === app.id;

        return (
          <div
            key={app.id}
            className={`flex items-center justify-between rounded-xl border p-3 transition-all ${
              isConnected ? 'border-green-200 bg-green-50' : 'border-[#e5e7eb] bg-white hover:border-[#d1d5db]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl text-lg" style={{ backgroundColor: `${app.color}15` }}>
                {app.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-[#0a0a0a]">{app.name}</p>
                <p className="text-xs text-[#9ca3af]">{app.reason}</p>
              </div>
            </div>

            <button
              onClick={() => handleConnect(app)}
              disabled={isConnected || isConnecting || allDone}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                isConnected
                  ? 'bg-green-100 text-green-700'
                  : isConnecting
                  ? 'bg-[#f3f4f6] text-[#6b7280]'
                  : 'bg-[#0a0a0a] text-white hover:bg-[#1a1a1a]'
              }`}
            >
              {isConnected ? (
                <><Check className="h-3.5 w-3.5" /> Connected</>
              ) : isConnecting ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Connecting...</>
              ) : (
                <><ExternalLink className="h-3.5 w-3.5" /> Connect</>
              )}
            </button>
          </div>
        );
      })}

      {schedule && (
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-[#f0f9ff] border border-[#bae6fd] px-3 py-2">
          <span className="text-sm">⏰</span>
          <span className="text-xs text-[#0369a1]">
            Schedule: {schedule.type === 'cron' ? `Cron (${schedule.value})` : schedule.value}
          </span>
        </div>
      )}

      {allDone && (
        <div className="mt-3 rounded-lg bg-green-50 border border-green-200 p-3 text-center">
          <p className="text-sm text-green-700 font-medium">✅ All connected! Running workflow...</p>
        </div>
      )}
    </div>
  );
}
