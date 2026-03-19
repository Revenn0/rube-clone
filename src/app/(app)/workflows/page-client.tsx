'use client';

import { useWorkflowStore, Workflow } from '@/lib/workflow-store';
import { Plus, ArrowRight, Play, Pause, Trash2, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

export default function WorkflowsPageClient() {
  const { workflows, pauseWorkflow, resumeWorkflow, deleteWorkflow, cleanupCompleted } = useWorkflowStore();

  // Cleanup completed one-time jobs on mount
  useEffect(() => {
    cleanupCompleted();
    const interval = setInterval(cleanupCompleted, 60000); // every minute
    return () => clearInterval(interval);
  }, [cleanupCompleted]);

  const active = workflows.filter((w) => w.status === 'active' || w.status === 'running');
  const completed = workflows.filter((w) => w.status === 'completed');
  const paused = workflows.filter((w) => w.status === 'paused');

  const formatSchedule = (workflow: Workflow) => {
    if (!workflow.schedule) return 'Manual';
    switch (workflow.schedule.type) {
      case 'cron':
        return `Cron: ${workflow.schedule.value}`;
      case 'once':
        return `Once: ${new Date(parseInt(workflow.schedule.value)).toLocaleString()}`;
      case 'delayed':
        return `Delayed: ${workflow.schedule.value}`;
      default:
        return 'Unknown';
    }
  };

  const formatLastRun = (ts?: number) => {
    if (!ts) return 'Never';
    const diff = Date.now() - ts;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(ts).toLocaleDateString();
  };

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="border-b border-border px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <button className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm font-medium text-foreground active:bg-border hover:bg-border transition-colors">
            <Plus className="h-4 w-4" />
            Create workflow
          </button>
          <span className="text-sm text-muted-foreground">{active.length} active</span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 py-5 sm:py-6 space-y-6">
        {/* Active Workflows */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Active workflows
            {active.length > 0 && (
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                {active.length}
              </span>
            )}
          </h3>
          {active.length === 0 ? (
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted px-5 sm:px-6 py-6 sm:py-8">
              <p className="text-sm text-muted-foreground">No active workflows</p>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2">
              {active.map((workflow) => (
                <div
                  key={workflow.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 hover:bg-card-hover transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      'h-2.5 w-2.5 rounded-full shrink-0',
                      workflow.status === 'running' ? 'bg-blue-400 animate-pulse' : 'bg-green-400'
                    )} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{workflow.name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatSchedule(workflow)}
                        </span>
                        <span>Apps: {workflow.apps.join(', ')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-3">
                    <span className="text-xs text-muted-foreground mr-2">{formatLastRun(workflow.lastRun)}</span>
                    <button
                      onClick={() => pauseWorkflow(workflow.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Pause className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => deleteWorkflow(workflow.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Paused */}
        {paused.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Paused
              <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{paused.length}</span>
            </h3>
            <div className="space-y-2">
              {paused.map((workflow) => (
                <div
                  key={workflow.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-muted px-4 py-3 opacity-70"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{workflow.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatSchedule(workflow)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => resumeWorkflow(workflow.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-green-50 hover:text-green-600"
                    >
                      <Play className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => deleteWorkflow(workflow.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Completed
              <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{completed.length}</span>
            </h3>
            <div className="space-y-2">
              {completed.map((workflow) => (
                <div
                  key={workflow.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-muted px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-muted-foreground truncate line-through">{workflow.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Completed {formatLastRun(workflow.completedAt)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteWorkflow(workflow.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
