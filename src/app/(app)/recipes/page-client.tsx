'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ArrowRight, Play, Pause, Trash2, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';

interface Workflow {
  id: string;
  name: string;
  description: string | null;
  apps: string[];
  status: string;
  lastRunAt: string | null;
  runCount: number;
  createdAt: string;
}

export function RecipesPageClient() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/workflows')
      .then((r) => r.json())
      .then((data) => {
        if (data.workflows) setWorkflows(data.workflows);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const createRecipe = () => {
    fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Create A New Recipe' }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.session?.id) {
          router.push(
            `/chat?session=${data.session.id}&message=${encodeURIComponent('Hey Jungor, create a new recipe for me')}`
          );
        } else {
          router.push(`/chat?message=${encodeURIComponent('Hey Jungor, create a new recipe for me')}`);
        }
      })
      .catch(() => router.push('/chat'));
  };

  const formatLastRun = (ts: string | null) => {
    if (!ts) return 'Never';
    const diff = Date.now() - new Date(ts).getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(ts).toLocaleDateString();
  };

  const active = workflows.filter((w) => w.status === 'active');
  const paused = workflows.filter((w) => w.status === 'paused');

  return (
    <div className="min-h-full">
      <div className="border-b border-border px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={createRecipe}
            className="flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white hover:bg-foreground/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create A New Recipe
          </button>
          <span className="text-sm text-muted-foreground">{active.length} active</span>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-5 sm:py-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : workflows.length === 0 ? (
          <EmptyState
            icon={<ArrowRight className="h-12 w-12" />}
            title="No recipes yet"
            description="Create your first recipe to automate workflows"
            onClick={createRecipe}
          />
        ) : (
          <>
            {active.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Active recipes
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    {active.length}
                  </span>
                </h3>
                <div className="space-y-2">
                  {active.map((wf) => (
                    <div
                      key={wf.id}
                      className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 hover:bg-card-hover transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-2.5 w-2.5 rounded-full bg-green-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{wf.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Apps: {wf.apps.length ? wf.apps.join(', ') : 'None'} · {wf.runCount} runs
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{formatLastRun(wf.lastRunAt)}</span>
                        <button
                          onClick={() => {}}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="Run"
                        >
                          <Play className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {paused.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Paused
                  <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    {paused.length}
                  </span>
                </h3>
                <div className="space-y-2">
                  {paused.map((wf) => (
                    <div
                      key={wf.id}
                      className="flex items-center justify-between rounded-xl border border-border bg-muted px-4 py-3 opacity-70"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{wf.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Apps: {wf.apps.join(', ')}</p>
                      </div>
                      <button
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-green-50 hover:text-green-600"
                        title="Resume"
                      >
                        <Play className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
