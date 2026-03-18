'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface WorkflowUpdate {
  id: string;
  name: string;
  status: string;
  runCount: number;
  lastRunAt: string | null;
  nextRunAt: string | null;
}

interface ExecutionUpdate {
  id: string;
  workflowId: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  workflow?: { name: string };
}

interface SSEData {
  workflows: WorkflowUpdate[];
  sessions: unknown[];
  executions: ExecutionUpdate[];
  timestamp: string;
}

export function useRealtime() {
  const [data, setData] = useState<SSEData | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    try {
      const es = new EventSource('/api/events');
      eventSourceRef.current = es;

      es.onopen = () => {
        setConnected(true);
      };

      es.addEventListener('init', (e) => {
        const parsed = JSON.parse(e.data);
        setData(parsed);
        setLastUpdate(new Date());
      });

      es.addEventListener('update', (e) => {
        const parsed = JSON.parse(e.data);
        setData((prev) => prev ? { ...prev, ...parsed } : parsed);
        setLastUpdate(new Date());
      });

      es.addEventListener('executions', (e) => {
        const executions = JSON.parse(e.data);
        if (executions.length > 0) {
          // Dispatch custom event for toast notifications
          window.dispatchEvent(new CustomEvent('workflow-execution', { detail: executions }));
        }
      });

      es.addEventListener('error', (e) => {
        console.error('SSE error:', e);
        setConnected(false);
        // Reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(connect, 5000);
      });

      es.onerror = () => {
        setConnected(false);
        es.close();
        reconnectTimeoutRef.current = setTimeout(connect, 5000);
      };
    } catch (err) {
      console.error('SSE connection failed:', err);
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      eventSourceRef.current?.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [connect]);

  return { data, connected, lastUpdate };
}
