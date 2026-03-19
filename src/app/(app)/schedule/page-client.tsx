'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, Repeat, Plus, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseNaturalSchedule } from '@/lib/schedule-parser';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/lib/toast';

interface ScheduledTask {
  id: string;
  name: string;
  prompt: string;
  schedule: string;
  time?: string;
  nextRun?: string;
  status: string;
}

const SCHEDULE_OPTIONS = [
  { value: 'daily', label: 'Every day' },
  { value: 'weekly', label: 'Every week' },
  { value: 'monthly', label: 'Every month' },
  { value: 'custom', label: 'Custom' },
];

const SCHEDULE_LABELS: Record<string, string> = {
  daily: 'Every day',
  weekly: 'Every week',
  monthly: 'Every month',
  custom: 'Custom',
};

export default function SchedulePageClient() {
  const { addToast } = useToast();
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<ScheduledTask | null>(null);
  const [form, setForm] = useState({
    name: '',
    prompt: '',
    schedule: 'daily',
    time: '09:00',
    days: [] as number[],
  });

  const handlePromptChange = useCallback((prompt: string) => {
    setForm((f) => {
      const parsed = parseNaturalSchedule(prompt);
      if (parsed.matched) {
        return {
          ...f,
          prompt,
          schedule: parsed.schedule,
          time: parsed.time,
        };
      }
      return { ...f, prompt };
    });
  }, []);

  useEffect(() => {
    fetch('/api/schedule')
      .then((r) => r.json())
      .then((d) => setTasks(d.tasks ?? []))
      .catch(() => {
        addToast('Failed to load scheduled tasks.', 'error');
        setTasks([]);
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doCreate = async () => {
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        setTasks((prev) => [...prev, data.task]);
        setShowForm(false);
        setShowConfirm(false);
        setForm({ name: '', prompt: '', schedule: 'daily', time: '09:00', days: [] });
        addToast('Scheduled task created successfully.', 'success');
      } else {
        addToast('Failed to create scheduled task. Please try again.', 'error');
      }
    } catch {
      addToast('Failed to create scheduled task. Please try again.', 'error');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const cronToSchedule = (cron: string): string => {
    if (!cron || typeof cron !== 'string') return 'daily';
    const parts = cron.split(/\s+/);
    if (parts[4] && parts[4] !== '*') return 'weekly';
    if (parts[2] && parts[2] !== '*') return 'monthly';
    return 'daily';
  };

  const handleEdit = (task: ScheduledTask) => {
    const schedule = cronToSchedule(task.schedule);
    setEditingTask(task);
    setForm({
      name: task.name,
      prompt: task.prompt,
      schedule,
      time: task.time ?? '09:00',
      days: [],
    });
    setShowForm(true);
  };

  const handleUpdate = async () => {
    if (!editingTask) return;
    try {
      const res = await fetch('/api/schedule', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTask.id,
          name: form.name,
          prompt: form.prompt,
          schedule: form.schedule,
          time: form.time,
        }),
      });
      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === editingTask.id
              ? { ...t, name: form.name, prompt: form.prompt, schedule: form.schedule, time: form.time }
              : t
          )
        );
        setEditingTask(null);
        setShowForm(false);
        setForm({ name: '', prompt: '', schedule: 'daily', time: '09:00', days: [] });
        addToast('Schedule updated successfully.', 'success');
      } else {
        addToast('Failed to update schedule. Please try again.', 'error');
      }
    } catch {
      addToast('Failed to update schedule. Please try again.', 'error');
    }
  };

  const handleDeleteRequest = (taskId: string) => {
    setTaskToDelete(taskId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;
    try {
      const res = await fetch(`/api/schedule?id=${taskToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== taskToDelete));
        addToast('Schedule deleted.', 'success');
      } else {
        addToast('Failed to delete schedule. Please try again.', 'error');
      }
    } catch {
      addToast('Failed to delete schedule. Please try again.', 'error');
    } finally {
      setTaskToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col">
      <div className="border-b border-border px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule
          </h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-hover transition-colors"
          >
            <Plus className="h-4 w-4" /> New Schedule
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {showForm && (
          <div className="mb-6 rounded-xl border border-border bg-card p-6">
            <h3 className="text-sm font-medium text-foreground mb-4">Create scheduled task</h3>
            <form onSubmit={(e) => { e.preventDefault(); editingTask ? handleUpdate() : setShowConfirm(true); }} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Daily email summary"
                  className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">What should Jungor do?</label>
                <textarea
                  value={form.prompt}
                  onChange={(e) => handlePromptChange(e.target.value)}
                  placeholder="e.g. todos os dias 9 da manhã, leia meus emails e coloque no Notion"
                  rows={3}
                  className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                    <Repeat className="h-3.5 w-3.5" /> Frequency
                  </label>
                  <select
                    value={form.schedule}
                    onChange={(e) => setForm((f) => ({ ...f, schedule: e.target.value }))}
                    className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-foreground"
                  >
                    {SCHEDULE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> Time
                  </label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                    className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-foreground"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover transition-colors">
                  {editingTask ? 'Save' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => { setEditingTask(null); setShowForm(false); setForm({ name: '', prompt: '', schedule: 'daily', time: '09:00', days: [] }); }}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-card-hover transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>

            <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
              <AlertDialogContent className="max-w-sm">
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Schedule</AlertDialogTitle>
                  <AlertDialogDescription>
                    <div className="space-y-2 text-left">
                      <p><strong>Name:</strong> {form.name}</p>
                      <p><strong>Task:</strong> {form.prompt}</p>
                      <p><strong>Frequency:</strong> {SCHEDULE_LABELS[form.schedule] ?? form.schedule}</p>
                      <p><strong>Time:</strong> {form.time}</p>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Edit</AlertDialogCancel>
                  <Button
                    onClick={() => doCreate()}
                    className="bg-brand hover:bg-brand-hover"
                  >
                    Confirm
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={<Calendar className="h-12 w-12" />}
            title="No scheduled tasks"
            description="Create scheduled tasks like &quot;Every day at 9am read my emails and categorize them&quot;"
            action={{ label: 'Create Schedule', onClick: () => setShowForm(true) }}
          />
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => handleEdit(task)}
                className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-3 cursor-pointer hover:border-brand/30 hover:bg-card-hover transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{task.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{task.prompt}</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Repeat className="h-3 w-3" /> {SCHEDULE_LABELS[cronToSchedule(task.schedule)] ?? task.schedule} at {task.time}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn(
                    'text-xs font-medium px-2 py-1 rounded-full',
                    task.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
                  )}>
                    {task.status}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteRequest(task.id); }}
                    className="p-2 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Delete schedule"
                    aria-label="Delete schedule"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete schedule?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The scheduled task will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
