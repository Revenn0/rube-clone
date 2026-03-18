'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { MessageSquare, Blocks, Workflow, Settings, Flame, Plus, Menu, X, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface DbSession {
  id: string;
  title: string;
  projectId: string;
  updatedAt: string;
  _count: { messages: number };
}

const PROJECTS = [
  { id: 'general', name: 'General', icon: '💬' },
  { id: 'email', name: 'Email & Comms', icon: '📧' },
  { id: 'dev', name: 'Development', icon: '💻' },
  { id: 'productivity', name: 'Productivity', icon: '📊' },
];

const navItems = [
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/workflows', label: 'Workflows', icon: Workflow },
  { href: '/apps', label: 'Apps', icon: Blocks },
  { href: '/settings', label: 'Settings', icon: Settings },
];

import { useRealtime } from '@/hooks/use-realtime';
import { ComposioTools } from './composio-tools';
import { RealtimeIndicator } from '@/components/ui/realtime-indicator';

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set(['general']));
  const [mounted, setMounted] = useState(false);
  const [sessions, setSessions] = useState<DbSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Real-time updates
  const { data: realtimeData, connected } = useRealtime();

  // Load sessions from DB
  useEffect(() => {
    setMounted(true);
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const res = await fetch('/api/sessions');
      const data = await res.json();
      if (data.sessions) setSessions(data.sessions);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  };

  const deleteSession = async (id: string) => {
    try {
      await fetch(`/api/sessions?id=${id}`, { method: 'DELETE' });
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const createSession = async () => {
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New chat' }),
      });
      const data = await res.json();
      if (data.session) {
        setSessions((prev) => [data.session, ...prev]);
        setCurrentSessionId(data.session.id);
        window.location.href = '/chat';
      }
    } catch (err) {
      console.error('Failed to create:', err);
    }
  };

  const getSessionsByProject = (projectId: string) =>
    sessions.filter((s) => s.projectId === projectId);

  const formatTime = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return `${Math.floor(diff / 86400000)}d`;
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b border-[#e5e7eb] bg-white px-4 lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#f26522]">
            <Flame className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-semibold text-[#0a0a0a]">rube</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#6b7280] hover:bg-[#f3f4f6]"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col border-r border-[#e5e7eb] bg-white transition-transform duration-200 lg:static lg:translate-x-0 lg:w-[260px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-14 items-center px-4 border-b border-[#e5e7eb]">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#f26522]">
              <Flame className="h-4 w-4 text-white" />
            </div>
            <span className="text-[15px] font-semibold text-[#0a0a0a] tracking-tight">rube</span>
          </Link>
        </div>

        <nav className="px-3 py-3 space-y-0.5 border-b border-[#e5e7eb]">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] transition-colors',
                  isActive ? 'bg-[#f3f4f6] text-[#0a0a0a] font-medium' : 'text-[#6b7280] hover:bg-[#f9fafb] hover:text-[#0a0a0a]'
                )}
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-medium text-[#9ca3af] uppercase tracking-wide">History</span>
            <button
              onClick={createSession}
              className="flex h-5 w-5 items-center justify-center rounded text-[#9ca3af] hover:text-[#0a0a0a] hover:bg-[#f3f4f6]"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {mounted && PROJECTS.map((project) => {
            const projectSessions = getSessionsByProject(project.id);
            const isExpanded = expandedProjects.has(project.id);
            return (
              <div key={project.id} className="mb-1">
                <button
                  onClick={() => {
                    setExpandedProjects((prev) => {
                      const next = new Set(prev);
                      if (next.has(project.id)) next.delete(project.id);
                      else next.add(project.id);
                      return next;
                    });
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-[#6b7280] hover:bg-[#f9fafb]"
                >
                  {isExpanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                  <span className="text-xs">{project.icon}</span>
                  <span className="text-xs font-medium truncate">{project.name}</span>
                  <span className="text-xs text-[#d1d5db] ml-auto">{projectSessions.length}</span>
                </button>
                {isExpanded && projectSessions.length > 0 && (
                  <div className="ml-4 space-y-0.5">
                    {projectSessions.slice(0, 10).map((session) => (
                      <div
                        key={session.id}
                        className={cn(
                          'group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm cursor-pointer transition-colors',
                          currentSessionId === session.id ? 'bg-[#f3f4f6] text-[#0a0a0a]' : 'text-[#6b7280] hover:bg-[#f9fafb] hover:text-[#0a0a0a]'
                        )}
                        onClick={() => {
                          setCurrentSessionId(session.id);
                          window.location.href = `/chat?session=${session.id}`;
                        }}
                      >
                        <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate flex-1 text-xs">{session.title}</span>
                        <span className="text-[10px] text-[#d1d5db]">{formatTime(session.updatedAt)}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                          className="hidden group-hover:flex h-5 w-5 items-center justify-center rounded text-[#9ca3af] hover:text-red-500"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {isExpanded && projectSessions.length === 0 && (
                  <div className="ml-6 px-2 py-1 text-xs text-[#d1d5db] italic">No chats</div>
                )}
              </div>
            );
          })}
        </div>

        <div className="border-t border-[#e5e7eb] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#f26522] to-[#ff8f44] text-sm font-semibold text-white">
              V
            </div>
            <div>
              <p className="text-sm font-medium text-[#0a0a0a]">Victor</p>
              <p className="text-xs text-[#9ca3af]">Free plan</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
