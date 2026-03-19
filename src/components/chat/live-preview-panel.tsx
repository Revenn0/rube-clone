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
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.06, duration: 0.3, ease: "easeOut" }}
      className={cn(
        'rounded-2xl border px-3 py-2.5 sm:px-4 sm:py-3.5',
        'bg-[#050505]/90 backdrop-blur-xl text-white border-white/10',
        'shadow-[0_8px_30px_rgba(0,0,0,0.12)]',
        isSuccess && 'border-l-[4px] border-l-green-500/80 bg-green-500/[0.02]',
        isError && 'border-l-[4px] border-l-red-500/80 bg-red-500/[0.02]'
      )}
    >
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <div className="shrink-0 relative">
          {isRunning ? (
            <>
              <div className="absolute inset-0 bg-brand/20 blur-md rounded-full animate-pulse" />
              <div
                className="relative h-6 w-6 rounded-full border-[2.5px] border-transparent border-t-brand border-r-[#ff8a50] border-b-brand/50 border-l-transparent animate-spin"
                style={{ animationDuration: '1s' }}
                aria-hidden
              />
            </>
          ) : isError ? (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
              <AlertCircle className="h-3.5 w-3.5 text-red-400" />
            </div>
          ) : (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 28 }}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.2)]"
            >
              <Check className="h-3.5 w-3.5 text-green-400" strokeWidth={3} />
            </motion.div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold tracking-wider text-white/90">
                {toolLabel}
              </span>
              <span className="text-[10px] font-bold tabular-nums text-brand/80 bg-brand/10 px-1.5 py-0.5 rounded-md border border-brand/20">
                {elapsed}s
              </span>
            </div>
            <span className="text-[11px] sm:text-xs text-white/50 leading-snug line-clamp-1 font-medium">
              {description}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center justify-center h-7 w-7 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            title={expanded ? 'Hide details' : 'Details'}
            aria-expanded={expanded}
          >
            <ChevronDown
              className={cn('h-4 w-4 transition-transform duration-300', expanded && 'rotate-180')}
            />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-white/10 space-y-4 text-left">
              {part.input != null && Object.keys(part.input as object).length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Wrench className="h-3 w-3 text-white/40" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                      Payload
                    </p>
                  </div>
                  <pre className="text-[11px] font-mono leading-relaxed bg-[#000000] rounded-xl p-3 border border-white/5 overflow-x-auto max-h-40 overflow-y-auto text-green-400/90 shadow-inner">
                    {JSON.stringify(part.input, null, 2)}
                  </pre>
                </div>
              )}
              {isSuccess && part.output != null && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="h-3 w-3 text-green-400/60" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                      Response
                    </p>
                  </div>
                  <div className="text-white/70 font-mono text-[11px] [&_pre]:bg-[#000000] [&_pre]:rounded-xl [&_pre]:p-3 [&_pre]:border-white/5 [&_pre]:shadow-inner">
                    <ToolOutputRenderer output={part.output} toolName={part.toolName} />
                  </div>
                </div>
              )}
              {isError && part.errorText && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <p className="text-xs text-red-400 font-mono">{part.errorText}</p>
                </div>
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
