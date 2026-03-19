'use client';

import { useState, useEffect } from 'react';
import { Wrench, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Tool {
  name: string;
  description: string;
}

export function ComposioTools() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/composio/tools')
      .then(r => r.json())
      .then(data => {
        if (data.tools) setTools(data.tools);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="border-t border-border px-3 py-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-card-hover"
      >
        {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        <Wrench className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">Composio Tools</span>
        <span className="ml-auto text-xs text-muted-foreground">{loading ? '...' : tools.length}</span>
      </button>

      {expanded && (
        <div className="ml-4 mt-1 space-y-0.5 max-h-48 overflow-y-auto">
          {loading ? (
            <div className="flex items-center gap-2 px-2 py-1">
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Loading tools...</span>
            </div>
          ) : tools.length === 0 ? (
            <p className="text-xs text-muted-foreground italic px-2 py-1">No tools available</p>
          ) : (
            tools.slice(0, 15).map((tool) => (
              <div
                key={tool.name}
                className="group flex items-start gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-card-hover cursor-default"
                title={tool.description}
              >
                <span className="font-mono text-xs text-brand shrink-0">
                  {tool.name.replace('COMPOSIO_', '').slice(0, 20)}
                </span>
              </div>
            ))
          )}
          {tools.length > 15 && (
            <p className="text-xs text-muted-foreground px-2 py-1">+{tools.length - 15} more</p>
          )}
        </div>
      )}
    </div>
  );
}
