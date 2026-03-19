'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, Check, Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const APP_ICONS: Record<string, string> = {
  gmail: '📧',
  slack: '💬',
  github: '🐙',
  notion: '📝',
  google_calendar: '📅',
  linear: '📋',
  create_schedule: '📆',
};

function getAppIcon(toolName: string): string {
  const normalized = toolName.replace(/^COMPOSIO_/, '').toLowerCase();
  for (const [key, icon] of Object.entries(APP_ICONS)) {
    if (normalized.includes(key)) return icon;
  }
  return '🔧';
}

export type ToolPartForPanel = {
  toolName: string;
  toolCallId?: string;
  state?: string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
};

interface ExecutionPanelProps {
  toolParts: ToolPartForPanel[];
  connections: Array<{ slug: string; name: string; isConnected: boolean }>;
  isLoading: boolean;
  onToggle?: () => void;
  isOpen?: boolean;
  className?: string;
}

export function ExecutionPanel({
  toolParts,
  connections,
  isLoading,
  onToggle,
  isOpen = true,
  className,
}: ExecutionPanelProps) {
  const [minimized, setMinimized] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const hasTools = toolParts.length > 0;
  const allComplete = hasTools && toolParts.every((p) => p.state === 'output-available' || p.state === 'output-error');
  const connectedCount = connections.filter((c) => c.isConnected).length;

  const displayParts = [...toolParts].reverse().slice(0, 10);

  if (!isOpen) return null;

  if (minimized && allComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'fixed bottom-4 right-4 z-40 rounded-xl border border-border bg-card shadow-lg p-3 cursor-pointer',
          'hover:shadow-xl transition-shadow',
          className
        )}
        onClick={() => setMinimized(false)}
      >
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-foreground">Complete</span>
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">View details</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 'auto', opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      className={cn(
        'flex flex-col border-l border-border bg-card shadow-sm',
        'w-full lg:w-[35%] min-w-[280px] max-w-[400px]',
        className
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Execution</h3>
        <div className="flex items-center gap-1">
          {allComplete && hasTools && (
            <button
              type="button"
              onClick={() => setMinimized(true)}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              title="Minimize"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          )}
          {onToggle && (
            <button
              type="button"
              onClick={onToggle}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!hasTools && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl border border-dashed border-border bg-muted/40 p-6 text-center"
          >
            <Wrench className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Waiting for task...</p>
            <p className="text-xs text-muted-foreground/80 mt-1">
              Executed tools will appear here
            </p>
          </motion.div>
        )}

        {hasTools && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Wrench className="h-3.5 w-3.5" />
              Steps ({toolParts.length})
            </h4>
            <div className="space-y-2">
              <AnimatePresence>
                {displayParts.map((part, i) => {
                  const isRunning =
                    part.state === 'input-streaming' || part.state === 'input-available';
                  const isSuccess = part.state === 'output-available';
                  const isError = part.state === 'output-error';
                  const toolName = part.toolName ?? '';
                  const displayName = toolName.replace(/^COMPOSIO_/, '').replace(/_/g, ' ');
                  const icon = getAppIcon(toolName);

                  return (
                    <motion.div
                      key={part.toolCallId ?? i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={cn(
                        'flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors',
                        isError && 'border-red-200 bg-red-50/50',
                        isSuccess && 'border-green-200 bg-green-50/30',
                        isRunning && 'border-amber-200 bg-amber-50/30'
                      )}
                    >
                      <span className="text-lg shrink-0">{icon}</span>
                      {isRunning ? (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-amber-600" />
                      ) : isError ? (
                        <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                      ) : (
                        <Check className="h-4 w-4 shrink-0 text-green-600" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {displayName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isRunning ? 'Executing...' : isError ? 'Error' : 'Complete'}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        )}

        <div>
          <h4 className="text-xs font-medium text-[#6b7280] mb-2 flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5" /> Connections ({connectedCount}/{connections.length})
          </h4>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {connections.filter((c) => c.isConnected).slice(0, 6).map((c) => (
              <div key={c.slug} className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-foreground truncate">{c.name}</span>
              </div>
            ))}
            {connectedCount === 0 && (
              <p className="text-xs text-muted-foreground">No apps connected</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
