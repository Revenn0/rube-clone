'use client';

import { useRealtime } from '@/hooks/use-realtime';
import { Wifi, WifiOff, Clock } from 'lucide-react';

export function RealtimeIndicator() {
  const { connected, lastUpdate } = useRealtime();

  return (
    <div className="flex items-center gap-1.5 text-xs text-[#9ca3af]">
      {connected ? (
        <>
          <Wifi className="h-3 w-3 text-green-500" />
          <span className="text-green-600">Live</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3 text-red-400" />
          <span className="text-red-400">Offline</span>
        </>
      )}
      {lastUpdate && (
        <>
          <span className="text-[#d1d5db] mx-1">•</span>
          <Clock className="h-3 w-3" />
          <span>{lastUpdate.toLocaleTimeString()}</span>
        </>
      )}
    </div>
  );
}
