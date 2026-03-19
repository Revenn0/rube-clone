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
      <div className="border-b border-border/50 bg-background/50 backdrop-blur-xl px-4 sm:px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <div className="p-2 bg-brand/10 rounded-lg text-brand">
              <Folder className="h-5 w-5" />
            </div>
            Projects
          </h2>
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-bold text-background hover:scale-105 active:scale-95 transition-all shadow-md"
          >
            <Plus className="h-4 w-4" /> New Project
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {showNewForm && (
            <form onSubmit={handleCreateProject} className="mb-8 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-6 shadow-lg animate-in slide-in-from-top-4 fade-in duration-300">
              <h3 className="text-base font-bold mb-4">Create New Project</h3>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="E.g., Marketing Automation"
                className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all shadow-sm"
                autoFocus
              />
              <div className="flex gap-3">
                <button type="submit" className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white hover:scale-105 active:scale-95 transition-all shadow-md shadow-brand/20">
                  Create Project
                </button>
                <button type="button" onClick={() => setShowNewForm(false)} className="rounded-xl border border-border/60 bg-card px-5 py-2.5 text-sm font-bold text-foreground hover:bg-muted transition-all">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {projects.length === 0 &&
          (!sessionsByProject.general || sessionsByProject.general.length === 0) ? (
            <div className="py-20 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
              <div className="h-24 w-24 bg-brand/10 rounded-3xl flex items-center justify-center mb-6">
                <Folder className="h-10 w-10 text-brand" />
              </div>
              <h2 className="text-2xl font-bold mb-2">No projects yet</h2>
              <p className="text-muted-foreground mb-8 max-w-sm">Create a project to organize your chats and automations into dedicated workspaces.</p>
              <button onClick={() => setShowNewForm(true)} className="rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white hover:scale-105 active:scale-95 transition-all shadow-md shadow-brand/20 flex items-center gap-2">
                <Plus className="h-4 w-4" /> Create First Project
              </button>
            </div>
          ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* General Project Card */}
            <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-5 shadow-sm hover:shadow-md transition-all flex flex-col">
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border/50">
                <div className="w-4 h-4 rounded-full shrink-0 bg-neutral-500" />
                <h3 className="text-base font-bold text-foreground tracking-tight">General</h3>
              </div>
              <div className="space-y-1.5 flex-1 min-h-[100px]">
                {(sessionsByProject.general ?? []).slice(0, 5).map((s) => (
                  <Link
                    key={s.id}
                    href={`/chat?session=${s.id}`}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-background hover:text-foreground border border-transparent hover:border-border/50 transition-all group"
                  >
                    <MessageSquare className="h-3.5 w-3.5 group-hover:text-brand transition-colors" />
                    <span className="truncate">{s.title}</span>
                  </Link>
                ))}
                {(!sessionsByProject.general || sessionsByProject.general.length === 0) && (
                  <p className="text-xs text-muted-foreground/60 py-4 text-center font-medium">No chats in this project</p>
                )}
              </div>
              <button
                onClick={() => handleNewChat('general')}
                className="mt-4 flex items-center justify-center gap-2 w-full rounded-xl bg-brand/10 text-brand py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-brand/20 transition-colors"
              >
                <Plus className="h-3 w-3" /> New Chat
              </button>
            </div>

            {/* Dynamic Project Cards */}
            {projects.map((proj) => (
              <div key={proj.id} className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-5 shadow-sm hover:shadow-md transition-all flex flex-col">
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border/50">
                  <div
                    className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: proj.color }}
                  />
                  <h3 className="text-base font-bold text-foreground tracking-tight">{proj.name}</h3>
                </div>
                <div className="space-y-1.5 flex-1 min-h-[100px]">
                  {(sessionsByProject[proj.id] ?? []).slice(0, 5).map((s) => (
                    <Link
                      key={s.id}
                      href={`/chat?session=${s.id}&project=${proj.id}`}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-background hover:text-foreground border border-transparent hover:border-border/50 transition-all group"
                    >
                      <MessageSquare className="h-3.5 w-3.5 group-hover:text-brand transition-colors" />
                      <span className="truncate">{s.title}</span>
                    </Link>
                  ))}
                  {(!sessionsByProject[proj.id] || sessionsByProject[proj.id].length === 0) && (
                    <p className="text-xs text-muted-foreground/60 py-4 text-center font-medium">No chats in this project</p>
                  )}
                </div>
                <button
                  onClick={() => handleNewChat(proj.id)}
                  className="mt-4 flex items-center justify-center gap-2 w-full rounded-xl bg-brand/10 text-brand py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-brand/20 transition-colors"
                >
                  <Plus className="h-3 w-3" /> New Chat
                </button>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
