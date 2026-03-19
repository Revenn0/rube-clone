'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, AlertCircle, ChevronDown, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToolOutputRenderer } from './tool-output-renderer';
import {
  type ToolPartForRender,
  getFriendlyInfo,
} from './tool-utils';

export type { ToolPartForRender };

interface LivePreviewPanelProps {
  parts: ToolPartForRender[];
}

function summarizeInput(input: unknown, toolName: string): string {
  const friendly = getFriendlyInfo(toolName);
  if (input == null || typeof input !== 'object') {
    if (typeof input === 'string' && input.trim()) return input.trim().slice(0, 140);
    return friendly.running;
  }
  const o = input as Record<string, unknown>;
  const pick =
    o.query ??
    o.prompt ??
    o.message ??
    o.search ??
    o.text ??
    o.instructions ??
    o.task;
  if (typeof pick === 'string' && pick.trim()) return pick.trim().slice(0, 140);
  const keys = Object.keys(o).filter((k) => !k.startsWith('_'));
  if (keys.length === 1 && typeof o[keys[0]] === 'string') {
    return String(o[keys[0]]).slice(0, 140);
  }
  return friendly.running;
}

function ToolCallPill({
  part,
  index,
  startMs,
}: {
  part: ToolPartForRender;
  index: number;
  startMs: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const isRunning =
    part.state === 'input-streaming' || part.state === 'input-available';
  const isSuccess = part.state === 'output-available';
  const isError = part.state === 'output-error';

  const friendly = getFriendlyInfo(part.toolName);
  const description = isRunning
    ? summarizeInput(part.input, part.toolName)
    : isError
      ? friendly.error
      : friendly.done;

  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const tick = () =>
      setElapsed(Math.max(0, Math.round((Date.now() - startMs) / 1000)));
    tick();
    if (!isRunning) return;
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [isRunning, startMs]);

  const toolLabel = part.toolName.replace(/^COMPOSIO_/, '').replace(/\s+/g, '_').toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.22 }}
      className={cn(
        'rounded-xl border px-3 py-2.5 sm:px-3.5 sm:py-3',
        'bg-[#141414] text-white border-[#2a2a2a]',
        'shadow-sm',
        isSuccess && 'border-l-[3px] border-l-green-500',
        isError && 'border-l-[3px] border-l-red-500'
      )}
    >
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <div className="shrink-0">
          {isRunning ? (
            <div
              className="h-5 w-5 rounded-full border-2 border-transparent border-t-violet-500 border-r-blue-500 border-b-fuchsia-500 border-l-cyan-400 animate-spin"
              style={{ animationDuration: '0.85s' }}
              aria-hidden
            />
          ) : isError ? (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/20">
              <AlertCircle className="h-3.5 w-3.5 text-red-400" />
            </div>
          ) : (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 28 }}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500"
            >
              <Check className="h-3 w-3 text-white" strokeWidth={3} />
            </motion.div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-mono text-xs font-bold tracking-wide text-white">
              {toolLabel}
            </span>
            <span className="text-[11px] sm:text-xs text-neutral-400 leading-snug line-clamp-2">
              {description}
            </span>
            <span className="text-[11px] font-medium tabular-nums text-amber-700/90 dark:text-amber-500/90">
              {elapsed}s
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="p-1 rounded-md text-neutral-500 hover:text-neutral-300 hover:bg-white/10 transition-colors"
            title={expanded ? 'Hide details' : 'Details'}
            aria-expanded={expanded}
          >
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')}
            />
          </button>
          <Wrench className="h-3.5 w-3.5 text-neutral-600 hidden sm:block" strokeWidth={1.5} />
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-white/10 space-y-2.5 text-left">
              {part.input != null && Object.keys(part.input as object).length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">
                    Arguments
                  </p>
                  <pre className="text-[11px] bg-black/40 rounded-lg p-2.5 border border-white/10 overflow-x-auto max-h-32 overflow-y-auto text-neutral-300">
                    {JSON.stringify(part.input, null, 2)}
                  </pre>
                </div>
              )}
              {isSuccess && part.output != null && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">
                    Result
                  </p>
                  <div className="text-neutral-200 [&_pre]:bg-black/40 [&_pre]:border-white/10">
                    <ToolOutputRenderer output={part.output} toolName={part.toolName} />
                  </div>
                </div>
              )}
              {isError && part.errorText && (
                <p className="text-xs text-red-300">{part.errorText}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function LivePreviewPanel({ parts }: LivePreviewPanelProps) {
  const panelStartRef = useRef<number>(Date.now());
  const stepStartsRef = useRef<Map<string, number>>(new Map());

  const partsSignature = parts.map((p) => `${p.toolCallId}-${p.state}`).join('|');
  useEffect(() => {
    panelStartRef.current = Date.now();
    stepStartsRef.current = new Map();
  }, [partsSignature]);

  for (const p of parts) {
    const key = p.toolCallId || p.toolName;
    if (!stepStartsRef.current.has(key)) {
      stepStartsRef.current.set(key, Date.now());
    }
  }

  if (parts.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
        Waiting for task...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {parts.map((part, i) => {
        const key = part.toolCallId || `${part.toolName}-${i}`;
        const startMs = stepStartsRef.current.get(key) ?? panelStartRef.current;
        return <ToolCallPill key={key} part={part} index={i} startMs={startMs} />;
      })}
    </div>
  );
}
