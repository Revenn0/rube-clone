'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useUser, useOrganization } from '@clerk/nextjs';
import { cn } from '@/lib/utils';
import { SidebarSkeleton } from '@/components/ui/skeletons';
import { useToast } from '@/lib/toast';
import { MessageSquare, Blocks, HelpCircle, Flame, Menu, X, Trash2, Plus, Search, Settings, Calendar, LogOut, Folder, PanelLeftClose, PanelLeft, Sun, Moon, Zap } from 'lucide-react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';

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
    return <div className="h-7 w-7 shrink-0 rounded-md bg-muted/50" aria-hidden />;
  }
  const dark = resolvedTheme === 'dark';
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-all"
      title={dark ? 'Light mode' : 'Dark mode'}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={dark ? 'dark' : 'light'}
          initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </motion.div>
      </AnimatePresence>
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
      <header className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-xl px-4 lg:hidden">
        <Link href="/chat" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl shadow-brand bg-gradient-to-br from-brand to-brand-hover">
            <Flame className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight">Jungor</span>
        </Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {mobileOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden" 
          onClick={() => setMobileOpen(false)} 
        />
      )}

      <motion.aside 
        layout
        initial={false}
        animate={{ width: collapsed ? 72 : 260 }}
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border/50 bg-sidebar/80 backdrop-blur-3xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:static lg:translate-x-0',
          mobileOpen ? 'translate-x-0 w-[260px]' : '-translate-x-full w-[260px]'
        )}
      >
        {/* Logo & Header */}
        <div className={cn(
          'flex h-16 items-center justify-between shrink-0 px-4 mt-2',
          collapsed && 'lg:justify-center lg:px-2'
        )}>
          <Link href="/chat" className="flex items-center gap-3 min-w-0 group outline-none rounded-xl">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-[#ff8a50] shadow-[0_2px_10px_rgba(242,101,34,0.3)] group-hover:shadow-[0_4px_16px_rgba(242,101,34,0.4)] transition-all duration-300">
              <Flame className="h-4 w-4 text-white" />
            </div>
            {!collapsed && <span className="text-base font-bold tracking-tight truncate">Jungor</span>}
          </Link>
          {!collapsed && (
            <button
              onClick={toggleCollapsed}
              className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-all"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="px-3 pt-2 pb-4 shrink-0">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={newChat}
            className={cn(
              "flex items-center justify-center gap-2 w-full rounded-xl bg-foreground text-background shadow-md hover:shadow-lg transition-all duration-300 relative overflow-hidden group",
              collapsed ? "h-10 px-0" : "h-10 px-4"
            )}
            title="New Chat"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
            <Plus className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="text-sm font-semibold">New Chat</span>}
          </motion.button>
        </div>

        {/* Nav */}
        <nav className={cn('px-3 pb-4 space-y-1', collapsed && 'lg:px-2')}>
          <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
            {!collapsed && "Platform"}
          </div>
          {[
            { href: '/chat', label: 'Chat', icon: MessageSquare },
            { href: '/projects', label: 'Projects', icon: Folder },
            { href: '/schedule', label: 'Schedule', icon: Calendar },
            { href: '/apps', label: 'Apps', icon: Blocks },
          ].map(item => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined} className={cn(
                'group flex items-center rounded-xl text-sm font-medium transition-all duration-200 outline-none',
                collapsed ? 'lg:justify-center lg:h-10 lg:w-10 mx-auto' : 'gap-3 px-3 py-2',
                isActive
                  ? 'bg-brand/10 text-brand'
                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
              )}>
                <item.icon className={cn('h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110', isActive && 'text-brand')} strokeWidth={isActive ? 2.5 : 2} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Recents / Chat history */}
        <div className={cn('flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1', collapsed && 'lg:overflow-hidden')}>
          <div className="mb-2 px-2 flex items-center justify-between">
            {!collapsed && <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Recent</span>}
          </div>
          
          {!collapsed && (
            <div className="relative mb-2 px-1">
              <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-3 rounded-lg border border-border/50 bg-background/50 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/30 transition-all"
              />
            </div>
          )}

          {!collapsed ? (
            loading ? (
              <div className="px-1"><SidebarSkeleton /></div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center opacity-60">
                <MessageSquare className="h-8 w-8 mb-3 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">No recent chats</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {sessions
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
                          'group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm cursor-pointer transition-all duration-200 outline-none',
                          isActive
                            ? 'bg-brand/5 text-foreground font-medium'
                            : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
                        )}
                      >
                        <div className={cn("w-1.5 h-1.5 rounded-full shrink-0 transition-colors", isActive ? "bg-brand" : "bg-transparent group-hover:bg-border")} />
                        <span className="truncate flex-1 text-xs">{session.title}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteChat(session.id); }}
                          className="opacity-0 group-hover:opacity-100 flex h-5 w-5 items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground/40 hover:text-destructive transition-all"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
              </div>
            )
          ) : (
            <div className="hidden lg:flex flex-col items-center gap-2 py-2">
              {sessions.slice(0, 5).map(session => {
                const isActive = pathname.includes(session.id);
                return (
                  <Link
                    key={session.id}
                    href={`/chat?session=${session.id}`}
                    title={session.title}
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200',
                      isActive ? 'bg-brand/10 text-brand' : 'text-muted-foreground hover:bg-sidebar-accent'
                    )}
                  >
                    <MessageSquare className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.5 : 2} />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Area */}
        <div className={cn('p-3 mt-auto shrink-0 border-t border-border/30 bg-sidebar/50', collapsed && 'lg:px-2')}>
          
          <div className="space-y-1 mb-3">
            <Link
              href="/use-jungor"
              title={collapsed ? 'Use Jungor' : undefined}
              className={cn(
                'group flex items-center rounded-xl text-sm font-medium transition-all duration-200',
                collapsed ? 'lg:justify-center lg:h-10 lg:w-10 mx-auto' : 'gap-3 px-3 py-2',
                pathname.startsWith('/use-jungor')
                  ? 'bg-brand/10 text-brand'
                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
              )}
            >
              <Zap className={cn('h-[18px] w-[18px] shrink-0 transition-transform group-hover:scale-110', pathname.startsWith('/use-jungor') && 'text-brand')} />
              {!collapsed && <span>Shortcuts & Tips</span>}
            </Link>

            <Link
              href="/settings"
              title={collapsed ? 'Settings' : undefined}
              className={cn(
                'group flex items-center rounded-xl text-sm font-medium transition-all duration-200',
                collapsed ? 'lg:justify-center lg:h-10 lg:w-10 mx-auto' : 'gap-3 px-3 py-2',
                pathname.startsWith('/settings')
                  ? 'bg-brand/10 text-brand'
                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
              )}
            >
              <Settings className="h-[18px] w-[18px] shrink-0 transition-transform group-hover:scale-110" />
              {!collapsed && <span>Settings</span>}
            </Link>
          </div>

          <div className={cn(
            'flex items-center rounded-xl border border-border/50 bg-background/50 shadow-sm transition-all hover:border-brand/30 hover:shadow-md cursor-pointer group',
            collapsed ? 'lg:justify-center p-1.5' : 'p-2'
          )}
            onClick={() => router.push('/settings')}
          >
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt="" className="h-9 w-9 rounded-lg object-cover ring-1 ring-border/50 shrink-0" />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #111 0%, #333 100%)' }}>
                {user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0] ?? 'U'}
              </div>
            )}
            
            {!collapsed && (
              <div className="min-w-0 flex-1 ml-2.5">
                <p className="text-xs font-bold text-foreground truncate group-hover:text-brand transition-colors">
                  {organization?.name ?? user?.firstName ?? 'My Account'}
                </p>
                <p className="text-[10px] text-muted-foreground/70 truncate font-medium">
                  {user?.emailAddresses?.[0]?.emailAddress ?? ''}
                </p>
              </div>
            )}

            {!collapsed && (
              <div className="shrink-0 mr-1 flex flex-col items-center gap-2">
                <span className="flex items-center justify-center h-5 px-1.5 text-[9px] font-black uppercase tracking-widest text-brand bg-brand/10 border border-brand/20 rounded-md">
                  Free
                </span>
              </div>
            )}
          </div>
          
          {collapsed && (
            <div className="mt-3 flex justify-center">
              <SidebarThemeToggle />
            </div>
          )}
          {!collapsed && (
             <div className="mt-3 flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                  <SidebarThemeToggle />
                  <span className="text-xs font-medium text-muted-foreground">Theme</span>
                </div>
                <Link
                  href="/sign-out"
                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </Link>
             </div>
          )}
        </div>
      </motion.aside>
    </>
  );
}
