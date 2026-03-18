'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Repeat, Plus, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export default function SchedulePageClient() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    prompt: '',
    schedule: 'daily',
    time: '09:00',
    days: [] as number[],
  });

  useEffect(() => {
    fetch('/api/schedule')
      .then((r) => r.json())
      .then((d) => setTasks(d.tasks ?? []))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        setForm({ name: '', prompt: '', schedule: 'daily', time: '09:00', days: [] });
      }
    } catch {}
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Excluir este agendamento?')) return;
    try {
      const res = await fetch(`/api/schedule?id=${taskId}`, { method: 'DELETE' });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
      }
    } catch {}
  };

  return (
    <div className="min-h-full flex flex-col">
      <div className="border-b border-[#e5e7eb] px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#0a0a0a] flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule
          </h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-lg bg-[#0a0a0a] px-3 py-2 text-sm font-medium text-white hover:bg-[#1a1a1a]"
          >
            <Plus className="h-4 w-4" /> New Schedule
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {showForm && (
          <div className="mb-6 rounded-xl border border-[#e5e7eb] bg-white p-6">
            <h3 className="text-sm font-medium text-[#0a0a0a] mb-4">Create scheduled task</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#6b7280] mb-1">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Daily email summary"
                  className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2.5 text-sm text-[#0a0a0a] placeholder:text-[#9ca3af]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6b7280] mb-1">What should Rube do?</label>
                <textarea
                  value={form.prompt}
                  onChange={(e) => setForm((f) => ({ ...f, prompt: e.target.value }))}
                  placeholder="e.g. Read my emails and categorize them for me"
                  rows={3}
                  className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2.5 text-sm text-[#0a0a0a] placeholder:text-[#9ca3af]"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#6b7280] mb-1 flex items-center gap-1">
                    <Repeat className="h-3.5 w-3.5" /> Frequency
                  </label>
                  <select
                    value={form.schedule}
                    onChange={(e) => setForm((f) => ({ ...f, schedule: e.target.value }))}
                    className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2.5 text-sm text-[#0a0a0a]"
                  >
                    {SCHEDULE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6b7280] mb-1 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> Time
                  </label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                    className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2.5 text-sm text-[#0a0a0a]"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a1a1a]">
                  Create
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#0a0a0a] hover:bg-[#f9fafb]">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#9ca3af]" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="rounded-xl border border-[#e5e7eb] bg-[#fafafa] p-12 text-center">
            <Calendar className="h-12 w-12 text-[#d1d5db] mx-auto mb-4" />
            <p className="text-sm font-medium text-[#0a0a0a] mb-1">No scheduled tasks</p>
            <p className="text-xs text-[#6b7280] mb-4">Create scheduled tasks like &quot;Every day at 9am read my emails and categorize them&quot;</p>
            <button onClick={() => setShowForm(true)} className="rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a1a1a]">
              Create Schedule
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="rounded-xl border border-[#e5e7eb] bg-white p-4 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#0a0a0a]">{task.name}</p>
                  <p className="text-xs text-[#6b7280] mt-0.5">{task.prompt}</p>
                  <p className="text-xs text-[#9ca3af] mt-1 flex items-center gap-1">
                    <Repeat className="h-3 w-3" /> {task.schedule} at {task.time}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn(
                    'text-xs font-medium px-2 py-1 rounded-full',
                    task.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-[#f3f4f6] text-[#6b7280]'
                  )}>
                    {task.status}
                  </span>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="p-2 rounded-lg text-[#9ca3af] hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
