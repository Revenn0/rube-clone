'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToolOutputRenderer } from './tool-output-renderer';
import {
  type ToolPartForRender,
  getAppIcon,
  getFriendlyInfo,
} from './tool-utils';

export type { ToolPartForRender };

interface ToolInvocationCardProps {
  part: ToolPartForRender;
}

export function ToolInvocationCard({ part }: ToolInvocationCardProps) {
  const [expanded, setExpanded] = useState(false);

  const isRunning = part.state === 'input-streaming' || part.state === 'input-available';
  const isComplete = part.state === 'output-available';
  const isError = part.state === 'output-error';

  const icon = getAppIcon(part.toolName);
  const friendly = getFriendlyInfo(part.toolName);
  const statusText = isRunning ? friendly.running : isError ? friendly.error : friendly.done;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        'my-2 rounded-xl border overflow-hidden transition-colors',
        isError
          ? 'border-red-200 bg-red-50/40'
          : isComplete
            ? 'border-green-200/60 bg-green-50/20'
            : 'border-amber-200/60 bg-amber-50/20'
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-black/[0.02] transition-colors"
      >
        <span className="text-base shrink-0">{icon}</span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground truncate">{statusText}</span>
            {isRunning && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500 shrink-0" />
            )}
            {isComplete && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              >
                <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
              </motion.div>
            )}
            {isError && <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
          </div>

          {isRunning && (
            <div className="mt-1.5 h-1 w-full rounded-full bg-amber-100 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-amber-400"
                initial={{ width: '0%' }}
                animate={{ width: ['0%', '65%', '75%', '65%'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          )}
        </div>

        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-muted-foreground"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-3.5 py-3 space-y-3 bg-card/60">
              {part.input != null && Object.keys(part.input as object).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Arguments</p>
                  <pre className="text-xs bg-muted rounded-lg p-2.5 border border-border overflow-x-auto max-h-32 overflow-y-auto text-foreground">
                    {JSON.stringify(part.input, null, 2)}
                  </pre>
                </div>
              )}
              {isComplete && part.output != null && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Result</p>
                  <ToolOutputRenderer output={part.output} toolName={part.toolName} />
                </div>
              )}
              {isError && part.errorText && (
                <div>
                  <p className="text-xs font-medium text-red-500 mb-1.5">Error</p>
                  <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2.5 border border-red-100">
                    {part.errorText}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
