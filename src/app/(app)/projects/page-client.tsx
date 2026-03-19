'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Folder, Plus, MessageSquare, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/lib/toast';

interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  createdAt: string;
}

interface ChatSession {
  id: string;
  title: string;
  projectId: string | null;
  updatedAt: string;
  _count?: { messages: number };
}

export default function ProjectsPageClient() {
  const router = useRouter();
  const { addToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [sessionsByProject, setSessionsByProject] = useState<Record<string, ChatSession[]>>({});
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const [projRes, sessRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/sessions'),
      ]);
      const projData = await projRes.json();
      const sessData = await sessRes.json();
      const projs = projData.projects ?? [];
      setProjects(projs);

      const byProject: Record<string, ChatSession[]> = { general: [] };
      for (const s of sessData.sessions ?? []) {
        const pid = s.projectId || 'general';
        if (!byProject[pid]) byProject[pid] = [];
        byProject[pid].push(s);
      }
      setSessionsByProject(byProject);
    } catch {
      addToast('Failed to load projects. Please try again.', 'error');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (res.ok) {
        await loadProjects();
        setNewName('');
        setShowNewForm(false);
        addToast('Project created successfully.', 'success');
      } else {
        addToast('Failed to create project. Please try again.', 'error');
      }
    } catch {
      addToast('Failed to create project. Please try again.', 'error');
    }
  };

  const handleNewChat = async (projectId: string) => {
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New chat', projectId }),
      });
      const data = await res.json();
      if (data.session?.id) {
        router.push(`/chat?session=${data.session.id}&project=${projectId}`);
      } else {
        addToast('Failed to create chat. Please try again.', 'error');
      }
    } catch {
      addToast('Failed to create chat. Please try again.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col">
      <div className="border-b border-border px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Projects
          </h2>
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="flex items-center gap-2 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-hover transition-colors"
          >
            <Plus className="h-4 w-4" /> New Project
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {showNewForm && (
          <form onSubmit={handleCreateProject} className="mb-6 rounded-xl border border-border bg-card p-4">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Project name"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-1 focus:ring-brand/30 focus:border-brand"
              autoFocus
            />
            <div className="flex gap-2">
              <button type="submit" className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-hover transition-colors">
                Create
              </button>
              <button type="button" onClick={() => setShowNewForm(false)} className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-card-hover transition-colors">
                Cancel
              </button>
            </div>
          </form>
        )}

        {projects.length === 0 &&
        (!sessionsByProject.general || sessionsByProject.general.length === 0) ? (
          <EmptyState
            icon={<Folder className="h-12 w-12" />}
            title="No projects yet"
            description="Create a project to organize your chats"
            action={{ label: 'New Project', onClick: () => setShowNewForm(true) }}
          />
        ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">General</h3>
            <div className="space-y-1">
              {(sessionsByProject.general ?? []).map((s) => (
                <Link
                  key={s.id}
                  href={`/chat?session=${s.id}`}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-card-hover hover:text-foreground"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  {s.title}
                </Link>
              ))}
              {(!sessionsByProject.general || sessionsByProject.general.length === 0) && (
                <p className="text-xs text-muted-foreground py-2">No chats yet</p>
              )}
            </div>
            <button
              onClick={() => handleNewChat('general')}
              className="mt-2 text-xs text-brand hover:underline"
            >
              + New chat
            </button>
          </div>

          {projects.map((proj) => (
            <div key={proj.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: proj.color }}
                />
                <h3 className="text-sm font-medium text-foreground">{proj.name}</h3>
              </div>
              <div className="space-y-1">
                {(sessionsByProject[proj.id] ?? []).map((s) => (
                  <Link
                    key={s.id}
                    href={`/chat?session=${s.id}&project=${proj.id}`}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-card-hover hover:text-foreground"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    {s.title}
                  </Link>
                ))}
                {(!sessionsByProject[proj.id] || sessionsByProject[proj.id].length === 0) && (
                  <p className="text-xs text-muted-foreground py-2">No chats yet</p>
                )}
              </div>
              <button
                onClick={() => handleNewChat(proj.id)}
                className="mt-2 text-xs text-brand hover:underline"
              >
                + New chat
              </button>
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}
