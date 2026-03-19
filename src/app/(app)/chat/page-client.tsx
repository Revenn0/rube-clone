'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls, isToolUIPart, getToolName, type UIMessage } from 'ai';
import { Bot, User, Loader2, Paperclip, ArrowUp, ExternalLink, Copy, ThumbsUp, ThumbsDown, Share2, Wand2, Check, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import LivePreviewPanel from '@/components/chat/live-preview-panel';
import { MarkdownRenderer } from '@/components/chat/markdown-renderer';

const SUGGESTIONS = [
  { icon: '📧', text: 'List my last 10 emails', desc: 'Gmail · Outlook' },
  { icon: '📅', text: 'Check my calendar for today', desc: 'Google Calendar' },
  { icon: '🐙', text: 'Show my GitHub repos', desc: 'GitHub' },
  { icon: '💬', text: 'Send a Slack message', desc: 'Slack' },
];

function extractConnectLinks(text: string): Array<{ app: string; url: string }> {
  const links: Array<{ app: string; url: string }> = [];
  const linkRegex = /\[Connect\s+(\w+[\s\w]*)\]\((https?:\/\/connect\.composio\.dev\/[^\)]+)\)/gi;
  const urlRegex = /(https?:\/\/connect\.composio\.dev\/\S+)/gi;
  let match;
  while ((match = linkRegex.exec(text)) !== null) {
    links.push({ app: match[1].trim(), url: match[2] });
  }
  if (links.length === 0) {
    while ((match = urlRegex.exec(text)) !== null) {
      links.push({ app: 'app', url: match[1] });
    }
  }
  return links;
}

export function ChatInterface() {
  const searchParams = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [initialMessagesLoaded, setInitialMessagesLoaded] = useState(false);
  const sessionIdRef = useRef<string | null>(null);
  sessionIdRef.current = sessionId;

  const urlSessionId = searchParams.get('session');
  const urlMessage = searchParams.get('message');
  const loadedForSessionRef = useRef<string | null>(null);

  const [connections, setConnections] = useState<Array<{ slug: string; name: string; isConnected: boolean }>>([]);

  const transportRef = useRef(
    new DefaultChatTransport({
      api: '/api/chat',
      prepareSendMessagesRequest: ({ body, messages, id, trigger, messageId }) => ({
        body: {
          ...body,
          messages,
          id,
          trigger,
          messageId,
          sessionId: sessionIdRef.current ?? body?.id ?? id,
        },
      }),
    })
  );

  const {
    messages,
    sendMessage,
    status,
    setMessages,
    error,
    clearError,
  } = useChat({
    id: sessionId ?? undefined,
    transport: transportRef.current,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    messages: [],
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  const urlConnected = searchParams.get('connected');
  useEffect(() => {
    const storedSession = typeof window !== 'undefined' && urlConnected ? localStorage.getItem('jungor_pendingConnectSession') : null;
    const targetSessionId = urlSessionId || storedSession || null;
    if (typeof window !== 'undefined' && urlConnected && storedSession) {
      localStorage.removeItem('jungor_pendingConnectSession');
    }
    if (!targetSessionId) {
      setSessionId(null);
      setMessages([]);
      loadedForSessionRef.current = null;
      setInitialMessagesLoaded(true);
      return;
    }

    if (loadedForSessionRef.current === targetSessionId) return;

    let cancelled = false;
    loadedForSessionRef.current = targetSessionId;
    setSessionId(targetSessionId);
    setMessages([]);
    setInitialMessagesLoaded(false);

    const load = async () => {
      const msgRes = await fetch(`/api/chat?sessionId=${targetSessionId}`);
      const text = await msgRes.text();
      let msgData: { messages?: unknown[] } = {};
      try {
        msgData = text?.trim() ? JSON.parse(text) : {};
      } catch {
        /* resposta vazia ou inválida */
      }
      if (cancelled) return;

      if (msgData.messages && msgData.messages.length > 0) {
        setMessages(msgData.messages as UIMessage[]);
      }
      setInitialMessagesLoaded(true);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [urlSessionId, urlConnected, setMessages]);

  useEffect(() => {
    if (!urlSessionId && initialMessagesLoaded) {
      const pickFirstSession = async () => {
        const res = await fetch('/api/sessions');
        const resText = await res.text();
        let data: { sessions?: { id: string }[] } = {};
        try {
          data = resText?.trim() ? JSON.parse(resText) : {};
        } catch {
          return;
        }
        if (data.sessions?.length) {
          const first = data.sessions[0];
          loadedForSessionRef.current = first.id;
          setSessionId(first.id);
          const msgRes = await fetch(`/api/chat?sessionId=${first.id}`);
          const msgText = await msgRes.text();
          let msgData: { messages?: unknown[] } = {};
          try {
            msgData = msgText?.trim() ? JSON.parse(msgText) : {};
          } catch {
            /* ignora */
          }
          if (msgData.messages && msgData.messages.length > 0) setMessages(msgData.messages as UIMessage[]);
        }
      };
      pickFirstSession();
    }
  }, [urlSessionId, initialMessagesLoaded, setMessages]);

  useEffect(() => {
    const root = scrollContainerRef.current;
    const sentinel = messagesEndRef.current;
    if (!root || !sentinel) return;
    const obs = new IntersectionObserver(
      ([e]) => setIsNearBottom(e?.isIntersecting ?? false),
      { root, rootMargin: '120px 0px 0px 0px', threshold: 0 }
    );
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, [messages.length, initialMessagesLoaded]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el || !isNearBottom) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, isNearBottom]);

  useEffect(() => {
    fetch('/api/composio/connections')
      .then(async (r) => {
        const text = await r.text();
        try {
          return text?.trim() ? JSON.parse(text) : {};
        } catch {
          return {};
        }
      })
      .then((d) => {
        const items = d.toolkits ?? [];
        setConnections(items.map((t: { slug: string; name: string; isConnected: boolean }) => ({
          slug: t.slug,
          name: t.name,
          isConnected: t.isConnected,
        })));
      })
      .catch(() => {});
  }, [messages]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const text = input.trim();
      if (!text) return;

      let sid = sessionId;
      if (!sid) {
        try {
          const res = await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: text.slice(0, 50) }),
          });
          const resText = await res.text();
          let data: { session?: { id?: string } } = {};
          try {
            data = resText?.trim() ? JSON.parse(resText) : {};
          } catch {
            /* resposta inválida (ex: HTML de redirect) */
          }
          sid = data.session?.id ?? null;
          if (sid) {
            sessionIdRef.current = sid;
            setSessionId(sid);
          }
        } catch (err) {
          console.error(err);
          return;
        }
      }

      setInput('');
      sendMessage({ text });
    },
    [input, sessionId, sendMessage]
  );

  const handleSuggestion = useCallback(
    async (text: string) => {
      let sid = sessionId;
      if (!sid) {
        try {
          const res = await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: text.slice(0, 50) }),
          });
          const resText = await res.text();
          let data: { session?: { id?: string } } = {};
          try {
            data = resText?.trim() ? JSON.parse(resText) : {};
          } catch {
            /* resposta inválida (ex: HTML de redirect) */
          }
          sid = data.session?.id ?? null;
          if (sid) {
            sessionIdRef.current = sid;
            setSessionId(sid);
          } else {
            return;
          }
        } catch (err) {
          console.error(err);
          return;
        }
      }
      sendMessage({ text });
    },
    [sessionId, sendMessage]
  );

  const urlMessageSent = useRef(false);
  const connectedResumeSent = useRef(false);

  useEffect(() => {
    if (urlMessage && initialMessagesLoaded && messages.length === 0 && !isLoading && !urlMessageSent.current) {
      urlMessageSent.current = true;
      handleSuggestion(decodeURIComponent(urlMessage));
      window.history.replaceState({}, '', window.location.pathname + (sessionId ? `?session=${sessionId}` : ''));
    }
  }, [urlMessage, initialMessagesLoaded, messages.length, isLoading, sessionId, handleSuggestion]);

  useEffect(() => {
    if (!urlConnected || !initialMessagesLoaded || connectedResumeSent.current || isLoading) return;
    if (messages.length === 0) return;
    connectedResumeSent.current = true;
    handleSuggestion('Continue');
    window.history.replaceState({}, '', window.location.pathname + (sessionId ? `?session=${sessionId}` : ''));
  }, [urlConnected, initialMessagesLoaded, messages.length, isLoading, sessionId, handleSuggestion]);

  const handleCopy = useCallback((text: string, messageId?: string) => {
    navigator.clipboard.writeText(text);
    if (messageId) {
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);


  const scrollToLatest = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    setIsNearBottom(true);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="relative flex flex-1 flex-col min-h-0 min-w-0">
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
      >
        {messages.length === 0 && !isLoading ? (
          <div className="flex h-full flex-col items-center justify-center px-5 sm:px-6 py-8">
            <div className="flex items-center justify-center h-16 w-16 rounded-3xl mb-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-brand to-[#ff8a50] opacity-90 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 mix-blend-overlay" />
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-white relative z-10 drop-shadow-md">
                <path d="M12 2L13.8 8.2L20 10L13.8 11.8L12 18L10.2 11.8L4 10L10.2 8.2L12 2Z" fill="currentColor"/>
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 text-center tracking-tight">
              What can I do for you?
            </h1>
            <p className="text-base text-muted-foreground mb-12 text-center max-w-md leading-relaxed">
              Connect your apps and automate anything in natural language. Try a suggestion below or just ask.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestion(s.text)}
                  className="group flex flex-col items-start gap-2 rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-4 sm:p-5 text-left transition-all duration-300 hover:border-brand/40 hover:bg-card hover:shadow-lg active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <div className="flex items-center gap-3 w-full">
                    <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-background shadow-sm text-lg border border-border/50 group-hover:scale-110 transition-transform duration-300">{s.icon}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 ml-auto group-hover:text-brand/70 transition-colors">Prompt</span>
                  </div>
                  <div className="min-w-0 mt-1">
                    <p className="text-sm font-semibold text-foreground leading-snug">{s.text}</p>
                    <p className="text-xs text-muted-foreground mt-1.5">{s.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl px-4 py-4 sm:py-6 space-y-3 sm:space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="group">
                {message.role === 'assistant' && (() => {
                  const toolUIParts = message.parts.filter(isToolUIPart);
                  return toolUIParts.length > 0 ? (
                    <div className="ml-10 sm:ml-11 mt-2">
                      <LivePreviewPanel
                        parts={toolUIParts.map((part) => ({
                          ...part,
                          toolName: getToolName(part),
                        }))}
                      />
                    </div>
                  ) : null;
                })()}
                {((message.role === 'assistant' && message.parts.some((p) => p.type === 'text')) || message.role === 'user') && (
                <div
                  className={cn(
                    'chat-message flex gap-2.5 sm:gap-3',
                    message.role === 'user' ? 'justify-end' : 'items-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg mt-0.5" style={{ background: 'linear-gradient(135deg, #f26522 0%, #ff8a50 100%)', boxShadow: '0 2px 8px rgba(242,101,34,0.3)' }}>
                      <Bot className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[85%] sm:max-w-[78%] text-sm leading-relaxed',
                      message.role === 'user'
                        ? 'rounded-2xl rounded-tr-sm px-4 py-2.5 text-white'
                        : 'py-1'
                    )}
                    style={message.role === 'user' ? {
                      background: 'linear-gradient(135deg, #f26522 0%, #e55a1d 100%)',
                      boxShadow: '0 2px 12px rgba(242,101,34,0.25)'
                    } : undefined}
                  >
                    {message.parts
                      .filter((p) => p.type === 'text')
                      .map((part, idx) => {
                        const text = String((part as { text: string }).text);
                        const links = extractConnectLinks(text);
                        const clean = text
                          .replace(/\[Connect\s+[\w\s]+\]\(https?:\/\/[^\)]+\)/gi, '')
                          .trim();
                        return (
                          <div key={idx} className="space-y-2">
                            <MarkdownRenderer content={clean || ' '} />
                            {links.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {links.map((link, i) => (
                                  <a
                                    key={i}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => {
                                      if (typeof window !== 'undefined' && sessionId) {
                                        localStorage.setItem('jungor_pendingConnectSession', sessionId);
                                        document.cookie = `jungor_pendingSession=${sessionId}; path=/; max-age=300`;
                                      }
                                    }}
                                    className="btn-brand flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-white w-fit"
                                  >
                                    <ExternalLink className="h-3 w-3" /> Connect {link.app}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                  {message.role === 'user' && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted mt-0.5 border border-border">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                )}
                {message.role === 'assistant' && message.parts.some((p) => p.type === 'text') && (
                  <div className="ml-10 sm:ml-11 mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          message.parts
                            .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
                            .map((p) => p.text)
                            .join(''),
                          message.id
                        )
                      }
                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Copy response"
                      aria-label="Copy response"
                    >
                      {copiedId === message.id ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Good response"
                      aria-label="Good response"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Bad response"
                      aria-label="Bad response"
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Share"
                      aria-label="Share conversation"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p>{error.message}</p>
                  {error.message?.includes('Upgrade') && (
                    <Link href="/settings?tab=billing" className="mt-2 inline-block text-xs font-medium text-red-800 underline hover:no-underline">
                      Go to Settings →
                    </Link>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => clearError?.()}
                  className="shrink-0 p-1 rounded hover:bg-red-100 text-red-600"
                  aria-label="Dismiss"
                >
                  ×
                </button>
              </div>
            )}
            {isLoading && (
              <div className="chat-message flex gap-2.5 sm:gap-3 items-start">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: 'linear-gradient(135deg, #f26522 0%, #ff8a50 100%)', boxShadow: '0 2px 8px rgba(242,101,34,0.3)' }}>
                  <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
                </div>
                <div className="flex items-center gap-1.5 py-2">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      {!isNearBottom && messages.length > 0 && (
        <button
          type="button"
          onClick={scrollToLatest}
          className="absolute bottom-[4.5rem] sm:bottom-20 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md hover:bg-muted transition-colors"
          title="Scroll to latest"
          aria-label="Scroll to latest message"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      )}

      <div className="border-t border-border/50 bg-background/60 backdrop-blur-xl safe-area-bottom shrink-0 pb-4 pt-2">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="relative flex items-center gap-2 rounded-2xl border border-border/60 bg-card/80 shadow-lg px-3 py-2 transition-all duration-300 focus-within:border-brand/50 focus-within:ring-4 focus-within:ring-brand/10 hover:border-border">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
              title="Attach"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleSuggestion('Hey Jungor, help me create a new automation')}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0 border border-transparent hover:border-border/50"
              title="Create Automation"
            >
              <Wand2 className="h-4 w-4" />
              <span className="hidden sm:inline">Automate</span>
            </button>
            <div className="w-px h-6 bg-border/60 mx-1 hidden sm:block" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message Jungor..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none min-w-0 px-2 py-1.5"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl text-white transition-all duration-300 shrink-0",
                input.trim() 
                  ? "bg-foreground hover:scale-105 active:scale-95 shadow-md" 
                  : "bg-muted text-muted-foreground opacity-50"
              )}
              style={input.trim() ? { background: 'linear-gradient(135deg, #f26522 0%, #e55a1d 100%)', boxShadow: '0 4px 12px rgba(242,101,34,0.3)' } : undefined}
            >
              <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
          <p className="text-center text-[10px] text-muted-foreground/50 mt-3 font-medium tracking-wide uppercase">
            Jungor is an AI. It can make mistakes. Verify important actions.
          </p>
        </form>
      </div>
      </div>
    </div>
  );
}
