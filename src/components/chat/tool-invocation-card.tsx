'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Wrench, Check, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToolOutputRenderer } from './tool-output-renderer';

/** Normalized tool part (static or dynamic) for rendering */
export type ToolPartForRender = {
  toolName: string;
  toolCallId: string;
  state: string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
};

interface ToolInvocationCardProps {
  part: ToolPartForRender;
}

export function ToolInvocationCard({ part }: ToolInvocationCardProps) {
  const [expanded, setExpanded] = useState(false);

  const isLoading =
    part.state === 'input-streaming' || part.state === 'input-available';
  const isComplete = part.state === 'output-available';
  const isError = part.state === 'output-error';

  const displayName = part.toolName.replace(/^COMPOSIO_/, '').replace(/_/g, ' ');

  return (
    <div
      className={cn(
        'my-2 rounded-xl border overflow-hidden transition-colors',
        isError
          ? 'border-red-200 bg-red-50/50'
          : isComplete
            ? 'border-green-200 bg-green-50/30'
            : 'border-[#e5e7eb] bg-[#f9fafb]'
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-black/[0.02] transition-colors"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#6b7280]" />
        ) : isError ? (
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
        ) : (
          <Check className="h-4 w-4 shrink-0 text-green-600" />
        )}
        <Wrench className="h-4 w-4 shrink-0 text-[#9ca3af]" />
        <span className="flex-1 text-sm font-medium text-[#0a0a0a]">
          {displayName}
        </span>
        <span className="text-xs text-[#9ca3af]">
          {isLoading ? 'Running...' : isError ? 'Error' : 'Completed'}
        </span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-[#9ca3af]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[#9ca3af]" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-[#e5e7eb] px-4 py-3 space-y-3">
          {part.input != null && Object.keys(part.input as object).length > 0 && (
            <div>
              <p className="text-xs font-medium text-[#6b7280] mb-1">Arguments</p>
              <pre className="text-xs bg-white rounded-lg p-3 border border-[#e5e7eb] overflow-x-auto max-h-40 overflow-y-auto">
                {JSON.stringify(part.input, null, 2)}
              </pre>
            </div>
          )}
          {part.state === 'output-available' && part.output != null && (
            <div>
              <p className="text-xs font-medium text-[#6b7280] mb-1">Result</p>
              <ToolOutputRenderer output={part.output} toolName={part.toolName} />
            </div>
          )}
          {part.state === 'output-error' && part.errorText && (
            <div>
              <p className="text-xs font-medium text-red-600 mb-1">Error</p>
              <p className="text-sm text-red-700">{part.errorText}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
