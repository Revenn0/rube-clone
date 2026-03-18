'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { useUser, useOrganization } from '@clerk/nextjs';
import { cn } from '@/lib/utils';
import { MessageSquare, Blocks, HelpCircle, Flame, Menu, X, Trash2, MessageSquarePlus, Search, Settings, Calendar, LogOut } from 'lucide-react';

interface ChatSession {
  id: string;
  title: string;
  projectId: string;
  updatedAt: string;
  _count?: { messages: number };
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const { organization } = useOrganization();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
        <Link href="/chat" className="flex items-center gap-2">
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
          <Link href="/chat" className="flex items-center gap-2">
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
            { href: '/schedule', label: 'Schedule', icon: Calendar },
            { href: '/apps', label: 'Apps', icon: Blocks },
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

        {/* Recents / Chat history */}
        <div className="flex-1 overflow-y-auto px-2 py-2 flex flex-col">
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9ca3af]" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-2 rounded-lg border border-[#e5e7eb] bg-white text-[13px] text-[#0a0a0a] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#f26522]/30 focus:border-[#f26522]"
            />
          </div>
          {sessions.length === 0 && !loading ? (
            <p className="text-xs text-[#9ca3af] text-center py-4">No chats yet</p>
          ) : (
            sessions
              .filter((s) =>
                searchQuery
                  ? s.title.toLowerCase().includes(searchQuery.toLowerCase())
                  : true
              )
              .map(session => {
              const isActive = pathname.includes(session.id);
              return (
                <div
                  key={session.id}
                  onClick={() => router.push(`/chat?session=${session.id}`)}
                  onMouseEnter={() => {
                    router.prefetch(`/chat?session=${session.id}`);
                    fetch(`/api/chat?sessionId=${session.id}`).catch(() => {});
                  }}
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

        {/* Bottom: Settings, Use Rube, Profile */}
        <div className="border-t border-[#e5e7eb] px-2 py-2 space-y-0.5">
          <Link
            href="/use-rube"
            className={cn(
              'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors',
              pathname.startsWith('/use-rube') ? 'bg-[#f3f4f6] text-[#0a0a0a] font-medium' : 'text-[#6b7280] hover:bg-[#f9fafb] hover:text-[#0a0a0a]'
            )}
          >
            <HelpCircle className="h-[17px] w-[17px] shrink-0" />
            <span>Use Rube</span>
          </Link>
          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors',
              pathname.startsWith('/settings') ? 'bg-[#f3f4f6] text-[#0a0a0a] font-medium' : 'text-[#6b7280] hover:bg-[#f9fafb] hover:text-[#0a0a0a]'
            )}
          >
            <Settings className="h-[17px] w-[17px] shrink-0" />
            <span>Settings</span>
          </Link>
          <Link
            href="/sign-out"
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] text-[#6b7280] hover:bg-[#f9fafb] hover:text-[#0a0a0a] transition-colors"
          >
            <LogOut className="h-[17px] w-[17px] shrink-0" />
            <span>Sair</span>
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 mt-1 hover:bg-[#f9fafb] transition-colors"
          >
            {user?.imageUrl ? (
              <img
                src={user.imageUrl}
                alt=""
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#f26522] to-[#ff8f44] text-xs font-semibold text-white">
                {user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0] ?? 'U'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-[#0a0a0a] truncate">
                {organization?.name ?? user?.firstName ?? 'My Org'}
              </p>
              <p className="text-[11px] text-[#9ca3af] truncate">
                {user?.emailAddresses?.[0]?.emailAddress ?? 'Free plan'}
              </p>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}
