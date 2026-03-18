'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls, isToolUIPart, getToolName } from 'ai';
import { Bot, User, Loader2, Paperclip, ArrowUp, ExternalLink, Copy, ThumbsUp, ThumbsDown, RotateCw, Share2, Wand2, PanelRightOpen, PanelRightClose, Wrench, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToolInvocationCard } from '@/components/chat/tool-invocation-card';
import { MarkdownRenderer } from '@/components/chat/markdown-renderer';

const SUGGESTIONS = [
  { icon: '📧', text: 'List my last 10 emails' },
  { icon: '📅', text: 'Check my calendar for today' },
  { icon: '🐙', text: 'Show my GitHub repos' },
  { icon: '💬', text: 'Send a Slack message' },
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
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [initialMessagesLoaded, setInitialMessagesLoaded] = useState(false);
  const sessionIdRef = useRef<string | null>(null);
  sessionIdRef.current = sessionId;

  const urlSessionId = searchParams.get('session');
  const urlMessage = searchParams.get('message');
  const loadedForSessionRef = useRef<string | null>(null);

  const [model, setModel] = useState('openai/gpt-5.4');
  const [showExecutionPanel, setShowExecutionPanel] = useState(false);
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
          model: modelRef.current,
        },
      }),
    })
  );
  const modelRef = useRef(model);
  modelRef.current = model;

  const {
    messages,
    sendMessage,
    status,
    setMessages,
    error,
  } = useChat({
    id: sessionId ?? undefined,
    transport: transportRef.current,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    messages: [],
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  const urlConnected = searchParams.get('connected');
  useEffect(() => {
    const storedSession = typeof window !== 'undefined' && urlConnected ? localStorage.getItem('rube_pendingConnectSession') : null;
    const targetSessionId = urlSessionId || storedSession || null;
    if (typeof window !== 'undefined' && urlConnected && storedSession) {
      localStorage.removeItem('rube_pendingConnectSession');
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
      const msgData = await msgRes.json();
      if (cancelled) return;

      if (msgData.messages?.length > 0) {
        setMessages(msgData.messages);
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
        const data = await res.json();
        if (data.sessions?.length) {
          const first = data.sessions[0];
          loadedForSessionRef.current = first.id;
          setSessionId(first.id);
          const msgRes = await fetch(`/api/chat?sessionId=${first.id}`);
          const msgData = await msgRes.json();
          if (msgData.messages?.length > 0) setMessages(msgData.messages);
        }
      };
      pickFirstSession();
    }
  }, [urlSessionId, initialMessagesLoaded, setMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    fetch('/api/composio/connections')
      .then((r) => r.json())
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
          const data = await res.json();
          sid = data.session?.id;
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
          const data = await res.json();
          sid = data.session?.id;
          if (sid) {
            sessionIdRef.current = sid;
            setSessionId(sid);
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

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  const toolParts = messages.flatMap((m) =>
    m.role === 'assistant' ? m.parts.filter(isToolUIPart) : []
  );
  const connectedCount = connections.filter((c) => c.isConnected).length;

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <div className="flex flex-1 flex-col min-w-0">
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {messages.length === 0 && !isLoading ? (
          <div className="flex h-full flex-col items-center justify-center px-5 sm:px-6">
            <h1 className="text-xl sm:text-2xl font-semibold text-[#0a0a0a] mb-2 text-center">
              How can I help you today?
            </h1>
            <p className="text-sm text-[#9ca3af] mb-6 text-center">
              Connect apps, automate workflows, get things done
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 w-full max-w-lg">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestion(s.text)}
                  className="flex items-center gap-3 rounded-xl border border-[#e5e7eb] bg-white p-3.5 sm:p-4 text-left text-sm text-[#374151] active:bg-[#f3f4f6] hover:bg-[#f9fafb] transition-colors"
                >
                  <span className="text-lg shrink-0">{s.icon}</span>
                  <span className="leading-snug">{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl px-4 py-4 sm:py-6 space-y-3 sm:space-y-4">
            {messages.map((message) => (
              <div key={message.id}>
                {message.role === 'assistant' && (
                  <>
                    {message.parts.filter(isToolUIPart).map((part, idx) => (
                      <div key={`tool-${idx}`} className="ml-10 sm:ml-11 mt-2">
                        <ToolInvocationCard
                          part={{
                            ...part,
                            toolName: getToolName(part),
                          }}
                        />
                      </div>
                    ))}
                  </>
                )}
                <div
                  className={cn(
                    'chat-message flex gap-2.5 sm:gap-3',
                    message.role === 'user' ? 'justify-end' : ''
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-[#f26522] mt-0.5">
                      <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[85%] sm:max-w-[80%] rounded-2xl px-3.5 py-2 sm:px-4 sm:py-2.5 text-[14px] sm:text-sm leading-relaxed',
                      message.role === 'user'
                        ? 'bg-[#0a0a0a] text-white'
                        : 'bg-[#f3f4f6] text-[#0a0a0a]'
                    )}
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
                                        localStorage.setItem('rube_pendingConnectSession', sessionId);
                                        document.cookie = `rube_pendingSession=${sessionId}; path=/; max-age=300`;
                                      }
                                    }}
                                    className="flex items-center gap-2 rounded-lg bg-[#f26522] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#e55a1d] w-fit"
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
                    <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-[#e5e7eb] mt-0.5">
                      <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#6b7280]" />
                    </div>
                  )}
                </div>
                {message.role === 'assistant' && message.parts.some((p) => p.type === 'text') && (
                  <div className="ml-10 sm:ml-11 mt-1 flex items-center gap-2 opacity-70">
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          message.parts
                            .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
                            .map((p) => p.text)
                            .join('')
                        )
                      }
                      className="p-1 rounded hover:bg-[#e5e7eb]"
                      title="Copy"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className="p-1 rounded hover:bg-[#e5e7eb]" title="Good">
                      <ThumbsUp className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className="p-1 rounded hover:bg-[#e5e7eb]" title="Bad">
                      <ThumbsDown className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className="p-1 rounded hover:bg-[#e5e7eb]" title="Regenerate">
                      <RotateCw className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className="p-1 rounded hover:bg-[#e5e7eb]" title="Share">
                      <Share2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error.message}
              </div>
            )}
            {isLoading && (
              <div className="chat-message flex gap-2.5 sm:gap-3">
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-[#f26522]">
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white animate-spin" />
                </div>
                <div className="rounded-2xl bg-[#f3f4f6] px-4 py-2.5 text-sm text-[#6b7280]">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="border-t border-[#e5e7eb] bg-white safe-area-bottom">
        <form onSubmit={handleSubmit} className="mx-auto max-w-2xl px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center gap-2 mb-4">
            <button
              type="button"
              onClick={() => setShowExecutionPanel(!showExecutionPanel)}
              className="hidden lg:flex items-center gap-1.5 rounded-lg border border-[#e5e7eb] px-2.5 py-1.5 text-xs font-medium text-[#6b7280] hover:bg-[#f9fafb]"
              title={showExecutionPanel ? 'Ocultar painel' : 'Mostrar painel de execução'}
            >
              {showExecutionPanel ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />}
              <span>Painel</span>
            </button>
            <label className="text-xs font-medium text-[#6b7280] shrink-0">Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="text-xs rounded-lg border border-[#e5e7eb] bg-white px-2.5 py-1.5 text-[#0a0a0a] focus:outline-none focus:ring-1 focus:ring-[#f26522]/30"
            >
              <option value="openai/gpt-5.4">GPT-5.4</option>
              <option value="anthropic/claude-sonnet-4.6">Claude Sonnet 4.6</option>
              <option value="zai/glm-5-turbo">GLM-5 Turbo</option>
              <option value="xai/grok-4.20-non-reasoning-beta">Grok 4.20</option>
            </select>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-[#e5e7eb] bg-white px-2.5 sm:px-3 py-2 focus-within:border-[#d1d5db] focus-within:shadow-sm transition-all">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9ca3af] hover:bg-[#f3f4f6] shrink-0"
              title="Attach"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleSuggestion('Hey Rube, create a new recipe for me')}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#6b7280] hover:bg-[#f3f4f6] shrink-0"
              title="Create Recipe"
            >
              <Wand2 className="h-4 w-4" />
              <span className="hidden sm:inline">Recipe</span>
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 bg-transparent text-[15px] sm:text-sm text-[#0a0a0a] placeholder:text-[#9ca3af] focus:outline-none min-w-0"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0a0a0a] text-white disabled:opacity-40 transition-colors shrink-0"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
      </div>

      {showExecutionPanel && (
        <div className="hidden lg:flex lg:w-72 xl:w-80 flex-col border-l border-[#e5e7eb] bg-[#fafafa] overflow-y-auto">
          <div className="p-4 border-b border-[#e5e7eb]">
            <h3 className="text-sm font-semibold text-[#0a0a0a]">Execução</h3>
            <p className="text-xs text-[#9ca3af] mt-0.5">Status do fluxo e conexões</p>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <h4 className="text-xs font-medium text-[#6b7280] mb-2 flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" /> Conexões ({connectedCount}/{connections.length})
              </h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {connections.filter((c) => c.isConnected).slice(0, 8).map((c) => (
                  <div key={c.slug} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-[#0a0a0a] truncate">{c.name}</span>
                  </div>
                ))}
                {connectedCount === 0 && (
                  <p className="text-xs text-[#9ca3af]">Nenhuma app conectada</p>
                )}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-medium text-[#6b7280] mb-2 flex items-center gap-1.5">
                <Wrench className="h-3.5 w-3.5" /> Ferramentas ({toolParts.length})
              </h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {toolParts.slice(-6).reverse().map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className={cn(
                      'w-2 h-2 rounded-full',
                      (p as { state?: string }).state === 'output-available' ? 'bg-green-500' :
                      (p as { state?: string }).state === 'output-error' ? 'bg-red-500' : 'bg-amber-400'
                    )} />
                    <span className="text-[#0a0a0a] truncate">
                      {getToolName(p).replace(/^COMPOSIO_/, '').replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
                {toolParts.length === 0 && (
                  <p className="text-xs text-[#9ca3af]">Nenhuma ferramenta executada</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
