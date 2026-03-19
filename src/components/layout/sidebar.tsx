'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useUser, useOrganization } from '@clerk/nextjs';
import { cn } from '@/lib/utils';
import { SidebarSkeleton } from '@/components/ui/skeletons';
import { useToast } from '@/lib/toast';
import { MessageSquare, Blocks, HelpCircle, Flame, Menu, X, Trash2, MessageSquarePlus, Search, Settings, Calendar, LogOut, Folder, PanelLeftClose, PanelLeft, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';

interface ChatSession {
  id: string;
  title: string;
  projectId: string;
  updatedAt: string;
  _count?: { messages: number };
}

function SidebarThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return <div className="h-7 w-7 shrink-0 rounded-md bg-muted" aria-hidden />;
  }
  const dark = resolvedTheme === 'dark';
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
      title={dark ? 'Light mode' : 'Dark mode'}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const { organization } = useOrganization();
  const { addToast } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem('jungor_sidebar_collapsed') === 'true');
  }, []);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') localStorage.setItem('jungor_sidebar_collapsed', String(next));
      return next;
    });
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const res = await fetch('/api/sessions');
      const data = await res.json();
      if (data.sessions) setSessions(data.sessions);
    } catch {
      // Silently fail for sidebar sessions - non-critical
    } finally {
      setLoading(false);
    }
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
      } else {
        addToast('Failed to create new chat.', 'error');
      }
    } catch {
      addToast('Failed to create new chat.', 'error');
    }
  };

  const deleteChat = async (id: string) => {
    try {
      const res = await fetch(`/api/sessions?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.id !== id));
      } else {
        addToast('Failed to delete chat.', 'error');
      }
    } catch {
      addToast('Failed to delete chat.', 'error');
    }
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
      <header className="fixed top-0 left-0 right-0 z-40 flex h-12 items-center justify-between border-b border-border bg-background px-3 lg:hidden">
        <Link href="/chat" className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-brand">
            <Flame className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold">Jungor</span>
        </Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-muted-foreground">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={() => setMobileOpen(false)} />}

      <aside className={cn(
        'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border bg-sidebar transition-all duration-200 lg:static lg:translate-x-0',
        mobileOpen ? 'translate-x-0 w-[260px]' : '-translate-x-full w-[260px]',
        'lg:w-[260px]',
        collapsed && 'lg:w-14 lg:overflow-hidden'
      )}>
        {/* Logo + New Chat + Collapse */}
        <div className={cn(
          'flex h-12 items-center justify-between border-b border-border shrink-0',
          collapsed ? 'px-2 lg:justify-center' : 'px-3'
        )}>
          <Link href="/chat" className="flex items-center gap-2 min-w-0">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-brand">
              <Flame className="h-3.5 w-3.5 text-white" />
            </div>
            {!collapsed && <span className="text-sm font-semibold tracking-tight truncate">Jungor</span>}
          </Link>
          <div className={cn('flex items-center gap-0.5 shrink-0', collapsed && 'lg:w-full lg:justify-center')}>
            {!collapsed && (
              <button onClick={newChat} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <MessageSquarePlus className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={toggleCollapsed}
              className="hidden lg:flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className={cn('px-2 py-2 space-y-0.5 border-b border-border', collapsed && 'lg:px-2')}>
          {[
            { href: '/chat', label: 'Chat', icon: MessageSquare },
            { href: '/projects', label: 'Projects', icon: Folder },
            { href: '/schedule', label: 'Schedule', icon: Calendar },
            { href: '/apps', label: 'Apps', icon: Blocks },
          ].map(item => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined} className={cn(
                'flex items-center rounded-lg text-sm transition-colors',
                collapsed ? 'lg:justify-center lg:px-2 lg:py-1.5' : 'gap-2.5 px-2.5 py-1.5',
                isActive ? 'bg-muted text-foreground font-medium' : 'text-muted-foreground hover:bg-card-hover hover:text-foreground'
              )}>
                <item.icon className="h-[17px] w-[17px] shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Recents / Chat history */}
        <div className={cn('flex-1 overflow-y-auto px-2 py-2 flex flex-col', collapsed && 'lg:overflow-hidden')}>
          <div className={cn('relative mb-2', collapsed && 'lg:hidden')}>
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-brand/30 focus:border-brand"
            />
          </div>
          {!collapsed && (loading ? (
            <SidebarSkeleton />
          ) : sessions.length === 0 ? (
            <p className="text-xs text-muted-foreground/70 text-center py-4">No chats yet</p>
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
                    'group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm cursor-pointer transition-colors',
                    isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-card-hover'
                  )}
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate flex-1">{session.title}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{formatTime(session.updatedAt)}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteChat(session.id); }}
                    className="hidden group-hover:flex h-5 w-5 items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground/70 hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              );
            })
          ))}
          {collapsed && (
            <div className="hidden lg:flex flex-col items-center gap-1 py-2">
              {sessions.slice(0, 5).map(session => {
                const isActive = pathname.includes(session.id);
                return (
                  <Link
                    key={session.id}
                    href={`/chat?session=${session.id}`}
                    title={session.title}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                      isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-card-hover'
                    )}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom: Settings, Use Jungor, Profile */}
        <div className={cn('border-t border-border px-2 py-2 space-y-0.5 shrink-0', collapsed && 'lg:px-2')}>
          <div className={cn('flex items-center px-2.5 py-1', collapsed && 'lg:justify-center lg:px-0')}>
            <SidebarThemeToggle />
          </div>
          <Link
            href="/use-jungor"
            title={collapsed ? 'Use Jungor' : undefined}
            className={cn(
              'flex items-center rounded-lg text-sm transition-colors',
              collapsed ? 'lg:justify-center lg:px-2 lg:py-1.5' : 'gap-2.5 px-2.5 py-1.5',
              pathname.startsWith('/use-jungor') ? 'bg-muted text-foreground font-medium' : 'text-muted-foreground hover:bg-card-hover hover:text-foreground'
            )}
          >
            <HelpCircle className="h-[17px] w-[17px] shrink-0" />
            {!collapsed && <span>Use Jungor</span>}
          </Link>
          <Link
            href="/settings"
            title={collapsed ? 'Settings' : undefined}
            className={cn(
              'flex items-center rounded-lg text-sm transition-colors',
              collapsed ? 'lg:justify-center lg:px-2 lg:py-1.5' : 'gap-2.5 px-2.5 py-1.5',
              pathname.startsWith('/settings') ? 'bg-muted text-foreground font-medium' : 'text-muted-foreground hover:bg-card-hover hover:text-foreground'
            )}
          >
            <Settings className="h-[17px] w-[17px] shrink-0" />
            {!collapsed && <span>Settings</span>}
          </Link>
          <Link
            href="/sign-out"
            title={collapsed ? 'Sign Out' : undefined}
            className={cn(
              'flex items-center rounded-lg text-sm text-muted-foreground hover:bg-card-hover hover:text-foreground transition-colors',
              collapsed ? 'lg:justify-center lg:px-2 lg:py-1.5' : 'gap-2.5 px-2.5 py-1.5'
            )}
          >
            <LogOut className="h-[17px] w-[17px] shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </Link>
          <Link
            href="/settings"
            className={cn(
              'flex items-center rounded-lg px-2 py-2 mt-1 hover:bg-card-hover transition-colors',
              collapsed ? 'lg:justify-center' : 'gap-2.5'
            )}
          >
            {user?.imageUrl ? (
              <img
                src={user.imageUrl}
                alt=""
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-hover text-xs font-semibold text-white">
                {user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0] ?? 'U'}
              </div>
            )}
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {organization?.name ?? user?.firstName ?? 'My Org'}
                </p>
                <p className="text-xs text-muted-foreground/70 truncate">
                  {user?.emailAddresses?.[0]?.emailAddress ?? 'Free plan'}
                </p>
              </div>
            )}
          </Link>
        </div>
      </aside>
    </>
  );
}
