'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { MessageSquare, Blocks, Workflow, Settings, Flame, Plus, Menu, X, Trash2, MessageSquarePlus } from 'lucide-react';

interface ChatSession {
  id: string;
  title: string;
  projectId: string;
  updatedAt: string;
  _count?: { messages: number };
}

const PROJECTS = [
  { id: 'general', name: 'General', icon: '💬' },
  { id: 'email', name: 'Email & Comms', icon: '📧' },
  { id: 'dev', name: 'Development', icon: '💻' },
  { id: 'productivity', name: 'Productivity', icon: '📊' },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const res = await fetch('/api/sessions');
      const data = await res.json();
      if (data.sessions) setSessions(data.sessions);
    } catch {} finally { setLoading(false); }
  };

  const newChat = async () => {
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New chat' }),
      });
      const data = await res.json();
      if (data.session?.id) {
        await loadSessions();
        router.push(`/chat?session=${data.session.id}`);
      }
    } catch {}
  };

  const deleteChat = async (id: string) => {
    try {
      await fetch(`/api/sessions?id=${id}`, { method: 'DELETE' });
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch {}
  };

  const formatTime = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return `${Math.floor(diff / 86400000)}d`;
  };

  return (
    <>
      {/* Mobile header */}
      <header className="fixed top-0 left-0 right-0 z-40 flex h-12 items-center justify-between border-b border-[#e5e7eb] bg-white px-3 lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-[#f26522]">
            <Flame className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold">rube</span>
        </Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-[#6b7280]">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={() => setMobileOpen(false)} />}

      <aside className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-[#e5e7eb] bg-white transition-transform lg:static lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo + New Chat */}
        <div className="flex h-12 items-center justify-between px-3 border-b border-[#e5e7eb]">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-[#f26522]">
              <Flame className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold tracking-tight">rube</span>
          </Link>
          <button onClick={newChat} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-[#f3f4f6] text-[#6b7280] hover:text-[#0a0a0a] transition-colors">
            <MessageSquarePlus className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="px-2 py-2 space-y-0.5 border-b border-[#e5e7eb]">
          {[
            { href: '/chat', label: 'Chat', icon: MessageSquare },
            { href: '/workflows', label: 'Workflows', icon: Workflow },
            { href: '/apps', label: 'Apps', icon: Blocks },
            { href: '/settings', label: 'Settings', icon: Settings },
          ].map(item => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={cn(
                'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors',
                isActive ? 'bg-[#f3f4f6] text-[#0a0a0a] font-medium' : 'text-[#6b7280] hover:bg-[#f9fafb] hover:text-[#0a0a0a]'
              )}>
                <item.icon className="h-[17px] w-[17px] shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Chat history */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {sessions.length === 0 && !loading ? (
            <p className="text-xs text-[#9ca3af] text-center py-4">No chats yet</p>
          ) : (
            sessions.map(session => {
              const isActive = pathname.includes(session.id);
              return (
                <div
                  key={session.id}
                  onClick={() => router.push(`/chat?session=${session.id}`)}
                  className={cn(
                    'group flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] cursor-pointer transition-colors',
                    isActive ? 'bg-[#f3f4f6] text-[#0a0a0a]' : 'text-[#6b7280] hover:bg-[#f9fafb]'
                  )}
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate flex-1">{session.title}</span>
                  <span className="text-[10px] text-[#d1d5db] shrink-0">{formatTime(session.updatedAt)}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteChat(session.id); }}
                    className="hidden group-hover:flex h-5 w-5 items-center justify-center rounded hover:bg-red-50 text-[#9ca3af] hover:text-red-500"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Profile */}
        <div className="border-t border-[#e5e7eb] px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#f26522] to-[#ff8f44] text-xs font-semibold text-white">
              V
            </div>
            <div>
              <p className="text-[13px] font-medium text-[#0a0a0a]">Victor</p>
              <p className="text-[11px] text-[#9ca3af]">Free plan</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
