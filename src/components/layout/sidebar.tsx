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
        mobileOpen ? 'translate-x-0 w-[256px]' : '-translate-x-full w-[256px]',
        'lg:w-[256px]',
        collapsed && 'lg:w-14 lg:overflow-hidden'
      )}>
        {/* Logo + New Chat + Collapse */}
        <div className={cn(
          'flex h-13 items-center justify-between border-b border-border shrink-0 px-3',
          collapsed && 'lg:justify-center lg:px-2'
        )}>
          <Link href="/chat" className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: 'linear-gradient(135deg, #f26522 0%, #ff8a50 100%)', boxShadow: '0 2px 8px rgba(242,101,34,0.3)' }}>
              <Flame className="h-4 w-4 text-white" />
            </div>
            {!collapsed && <span className="text-sm font-bold tracking-tight truncate">Jungor</span>}
          </Link>
          <div className={cn('flex items-center gap-0.5 shrink-0', collapsed && 'lg:hidden')}>
            {!collapsed && (
              <button
                onClick={newChat}
                className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-colors"
                title="New chat"
              >
                <MessageSquarePlus className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={toggleCollapsed}
              className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-colors"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
          </div>
          {collapsed && (
            <button
              onClick={toggleCollapsed}
              className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-colors"
              title="Expand sidebar"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className={cn('px-2 pt-2 pb-1.5 space-y-0.5 border-b border-border', collapsed && 'lg:px-2')}>
          {[
            { href: '/chat', label: 'Chat', icon: MessageSquare },
            { href: '/projects', label: 'Projects', icon: Folder },
            { href: '/schedule', label: 'Schedule', icon: Calendar },
            { href: '/apps', label: 'Apps', icon: Blocks },
          ].map(item => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined} className={cn(
                'flex items-center rounded-lg text-sm transition-all duration-150',
                collapsed ? 'lg:justify-center lg:px-2 lg:py-2' : 'gap-2.5 px-2.5 py-2',
                isActive
                  ? 'bg-brand/10 text-brand font-medium'
                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
              )}>
                <item.icon className={cn('h-[17px] w-[17px] shrink-0', isActive && 'text-brand')} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Recents / Chat history */}
        <div className={cn('flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-0.5', collapsed && 'lg:overflow-hidden')}>
          {!collapsed && (
            <>
              <div className="relative mb-1.5">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8 pl-8 pr-2 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-brand/30 focus:border-brand/40 transition-all"
                />
              </div>
              {loading ? (
                <SidebarSkeleton />
              ) : sessions.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 text-center py-6">No chats yet.<br/>Start a conversation above.</p>
              ) : (
                sessions
                  .filter((s) => searchQuery ? s.title.toLowerCase().includes(searchQuery.toLowerCase()) : true)
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
                          'group flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm cursor-pointer transition-all',
                          isActive
                            ? 'bg-brand/10 text-foreground'
                            : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
                        )}
                      >
                        <MessageSquare className={cn('h-3.5 w-3.5 shrink-0', isActive && 'text-brand')} />
                        <span className="truncate flex-1 text-xs">{session.title}</span>
                        <span className="text-[10px] text-muted-foreground/50 shrink-0 group-hover:hidden">{formatTime(session.updatedAt)}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteChat(session.id); }}
                          className="hidden group-hover:flex h-5 w-5 items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground/60 hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })
              )}
            </>
          )}
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
                      isActive ? 'bg-brand/10 text-brand' : 'text-muted-foreground hover:bg-sidebar-accent'
                    )}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom */}
        <div className={cn('border-t border-border px-2 py-2 space-y-0.5 shrink-0')}>
          <div className={cn('flex items-center', collapsed ? 'lg:justify-center px-0 py-1' : 'px-1 py-1')}>
            <SidebarThemeToggle />
            {!collapsed && <span className="ml-2 text-xs text-muted-foreground">Theme</span>}
          </div>
          <Link
            href="/use-jungor"
            title={collapsed ? 'Use Jungor' : undefined}
            className={cn(
              'flex items-center rounded-lg text-sm transition-all',
              collapsed ? 'lg:justify-center lg:px-2 lg:py-2' : 'gap-2.5 px-2.5 py-2',
              pathname.startsWith('/use-jungor')
                ? 'bg-brand/10 text-brand font-medium'
                : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
            )}
          >
            <HelpCircle className="h-[17px] w-[17px] shrink-0" />
            {!collapsed && <span>Use Jungor</span>}
          </Link>
          <Link
            href="/settings"
            title={collapsed ? 'Settings' : undefined}
            className={cn(
              'flex items-center rounded-lg text-sm transition-all',
              collapsed ? 'lg:justify-center lg:px-2 lg:py-2' : 'gap-2.5 px-2.5 py-2',
              pathname.startsWith('/settings')
                ? 'bg-brand/10 text-brand font-medium'
                : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
            )}
          >
            <Settings className="h-[17px] w-[17px] shrink-0" />
            {!collapsed && <span>Settings</span>}
          </Link>
          <Link
            href="/sign-out"
            title={collapsed ? 'Sign Out' : undefined}
            className={cn(
              'flex items-center rounded-lg text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-all',
              collapsed ? 'lg:justify-center lg:px-2 lg:py-2' : 'gap-2.5 px-2.5 py-2'
            )}
          >
            <LogOut className="h-[17px] w-[17px] shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </Link>

          {/* Profile card */}
          <div className={cn(
            'flex items-center rounded-xl mt-1 border border-border transition-all hover:bg-sidebar-accent cursor-pointer',
            collapsed ? 'lg:justify-center p-1.5' : 'gap-2.5 px-2 py-2'
          )}
            onClick={() => router.push('/settings')}
          >
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt="" className="h-8 w-8 rounded-full object-cover ring-2 ring-border shrink-0" />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #f26522 0%, #ff8a50 100%)' }}>
                {user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0] ?? 'U'}
              </div>
            )}
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate">
                  {organization?.name ?? user?.firstName ?? 'My Account'}
                </p>
                <p className="text-[10px] text-muted-foreground/70 truncate">
                  {user?.emailAddresses?.[0]?.emailAddress ?? ''}
                </p>
              </div>
            )}
            {!collapsed && (
              <span className="text-[9px] font-bold uppercase tracking-wider text-brand border border-brand/30 rounded px-1 py-0.5 shrink-0">
                Free
              </span>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
