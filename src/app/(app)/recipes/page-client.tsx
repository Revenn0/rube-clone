'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ArrowRight, Play, Pause, Trash2, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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
            `/chat?session=${data.session.id}&message=${encodeURIComponent('Hey Rube, create a new recipe for me')}`
          );
        } else {
          router.push(`/chat?message=${encodeURIComponent('Hey Rube, create a new recipe for me')}`);
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
      <div className="border-b border-[#e5e7eb] px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={createRecipe}
            className="flex items-center gap-2 rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a1a1a] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create A New Recipe
          </button>
          <span className="text-sm text-[#6b7280]">{active.length} active</span>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-5 sm:py-6 space-y-6">
        {loading ? (
          <p className="text-sm text-[#9ca3af]">Loading recipes...</p>
        ) : workflows.length === 0 ? (
          <div
            onClick={createRecipe}
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#e5e7eb] bg-[#fafafa] px-5 sm:px-6 py-12 sm:py-16 cursor-pointer hover:border-[#d1d5db] hover:bg-[#f9fafb] transition-colors"
          >
            <p className="text-sm text-[#6b7280] mb-2">No recipes yet</p>
            <p className="text-xs text-[#9ca3af] mb-4">Create your first recipe to automate workflows</p>
            <ArrowRight className="h-5 w-5 text-[#d1d5db]" />
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-[#6b7280] mb-3">
                  Active recipes
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    {active.length}
                  </span>
                </h3>
                <div className="space-y-2">
                  {active.map((wf) => (
                    <div
                      key={wf.id}
                      className="flex items-center justify-between rounded-xl border border-[#e5e7eb] bg-white px-4 py-3 hover:bg-[#f9fafb] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-2.5 w-2.5 rounded-full bg-green-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#0a0a0a] truncate">{wf.name}</p>
                          <p className="text-xs text-[#9ca3af] mt-0.5">
                            Apps: {wf.apps.length ? wf.apps.join(', ') : 'None'} · {wf.runCount} runs
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-[#9ca3af]">{formatLastRun(wf.lastRunAt)}</span>
                        <button
                          onClick={() => {}}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9ca3af] hover:bg-[#f3f4f6] hover:text-[#0a0a0a]"
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
                <h3 className="text-sm font-medium text-[#6b7280] mb-3">
                  Paused
                  <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    {paused.length}
                  </span>
                </h3>
                <div className="space-y-2">
                  {paused.map((wf) => (
                    <div
                      key={wf.id}
                      className="flex items-center justify-between rounded-xl border border-[#e5e7eb] bg-[#fafafa] px-4 py-3 opacity-70"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#0a0a0a] truncate">{wf.name}</p>
                        <p className="text-xs text-[#9ca3af] mt-0.5">Apps: {wf.apps.join(', ')}</p>
                      </div>
                      <button
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9ca3af] hover:bg-green-50 hover:text-green-600"
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
