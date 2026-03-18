'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Bot, User, Loader2, Paperclip, ArrowUp, ExternalLink, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/lib/chat-store';

interface ConnectLink {
  app: string;
  url: string;
  connected?: boolean;
}

const SUGGESTIONS = [
  { icon: '📧', text: 'List my last 10 emails' },
  { icon: '📅', text: 'Check my calendar for today' },
  { icon: '🐙', text: 'Show my GitHub repos' },
  { icon: '💬', text: 'Send a Slack message' },
];

const genId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

function extractConnectLinks(text: string): { clean: string; links: ConnectLink[] } {
  const links: ConnectLink[] = [];
  const linkRegex = /\[Connect\s+(\w+[\s\w]*)\]\((https?:\/\/connect\.composio\.dev\/[^\)]+)\)/gi;
  const urlRegex = /(https?:\/\/connect\.composio\.dev\/\S+)/gi;
  let clean = text;
  let match;
  while ((match = linkRegex.exec(text)) !== null) {
    links.push({ app: match[1].trim(), url: match[2] });
  }
  if (links.length === 0) {
    while ((match = urlRegex.exec(text)) !== null) {
      links.push({ app: 'app', url: match[1] });
    }
  }
  clean = text.replace(/\[Connect\s+[\w\s]+\]\(https?:\/\/[^\)]+\)/gi, '').trim();
  return { clean, links };
}

export function ChatInterface() {
  const searchParams = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    sessionId, messages, isLoading, initialized,
    setSessionId, addMessage, updateMessage, setLoading, setInitialized, clearMessages,
  } = useChatStore();

  // Initialize from DB on first load
  useEffect(() => {
    if (initialized) return;
    setInitialized(true);
    const init = async () => {
      try {
        const urlSessionId = searchParams.get('session');
        const res = await fetch('/api/sessions');
        const data = await res.json();
        if (data.sessions?.length > 0) {
          const target = urlSessionId
            ? data.sessions.find((s: { id: string }) => s.id === urlSessionId) || data.sessions[0]
            : data.sessions[0];
          setSessionId(target.id);
          const msgRes = await fetch(`/api/chat?sessionId=${target.id}`);
          const msgData = await msgRes.json();
          if (msgData.messages?.length > 0) {
            clearMessages();
            setSessionId(target.id);
            msgData.messages.forEach((m: { id: string; role: string; content: string }) => {
              addMessage({ id: m.id, role: m.role as 'user' | 'assistant', content: m.content });
            });
          }
        }
      } catch (err) { console.error(err); }
    };
    init();
  }, [initialized]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Store input in ref to avoid re-renders
  const inputRef2 = useRef<HTMLInputElement>(null);
  const getInput = () => inputRef2.current?.value || '';
  const setInput = (v: string) => { if (inputRef2.current) inputRef2.current.value = v; };

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

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
        setSessionId(sid!);
      } catch (err) { console.error(err); return; }
    }

    const userMsg = { id: genId(), role: 'user' as const, content: text };
    addMessage(userMsg);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sid,
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error('Failed');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let content = '';
      const assistantMsg = { id: genId(), role: 'assistant' as const, content: '' };
      addMessage(assistantMsg);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          content += decoder.decode(value, { stream: true });
          const { clean, links } = extractConnectLinks(content);
          updateMessage(assistantMsg.id, { content: clean, connectLinks: links.length > 0 ? links : undefined });
        }
      }
    } catch (err) {
      console.error(err);
      addMessage({ id: genId(), role: 'assistant', content: 'Sorry, something went wrong.' });
    } finally {
      setLoading(false);
      inputRef2.current?.focus();
    }
  }, [sessionId, messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(getInput());
  };

  const handleConnected = useCallback((msgId: string, linkIdx: number) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg?.connectLinks) return;
    const newLinks = [...msg.connectLinks];
    newLinks[linkIdx] = { ...newLinks[linkIdx], connected: true };
    updateMessage(msgId, { connectLinks: newLinks });
    setTimeout(() => sendMessage("I've connected it, please continue."), 500);
  }, [messages, sendMessage]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-5 sm:px-6">
            <h1 className="text-xl sm:text-2xl font-semibold text-[#0a0a0a] mb-2 text-center">How can I help you today?</h1>
            <p className="text-sm text-[#9ca3af] mb-6 text-center">Connect apps, automate workflows, get things done</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 w-full max-w-lg">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => sendMessage(s.text)}
                  className="flex items-center gap-3 rounded-xl border border-[#e5e7eb] bg-white p-3.5 sm:p-4 text-left text-sm text-[#374151] active:bg-[#f3f4f6] hover:bg-[#f9fafb] transition-colors">
                  <span className="text-lg shrink-0">{s.icon}</span><span className="leading-snug">{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl px-4 py-4 sm:py-6 space-y-3 sm:space-y-4">
            {messages.map((message) => (
              <div key={message.id}>
                <div className={cn('chat-message flex gap-2.5 sm:gap-3', message.role === 'user' ? 'justify-end' : '')}>
                  {message.role === 'assistant' && (
                    <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-[#f26522] mt-0.5">
                      <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                    </div>
                  )}
                  <div className={cn('max-w-[85%] sm:max-w-[80%] rounded-2xl px-3.5 py-2 sm:px-4 sm:py-2.5 text-[14px] sm:text-sm leading-relaxed',
                    message.role === 'user' ? 'bg-[#0a0a0a] text-white' : 'bg-[#f3f4f6] text-[#0a0a0a]')}>
                    {message.content}
                  </div>
                  {message.role === 'user' && (
                    <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-[#e5e7eb] mt-0.5">
                      <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#6b7280]" />
                    </div>
                  )}
                </div>
                {message.connectLinks && message.connectLinks.length > 0 && (
                  <div className="ml-10 sm:ml-11 mt-3 space-y-2">
                    {message.connectLinks.map((link, idx) => (
                      <div key={idx} className={cn('flex items-center justify-between rounded-xl border p-3 transition-all',
                        link.connected ? 'border-green-200 bg-green-50' : 'border-[#e5e7eb] bg-white hover:border-[#f26522]')}>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f26522]/10 text-lg">
                            {link.app.toLowerCase().includes('gmail') ? '📧' : link.app.toLowerCase().includes('calendar') ? '📅' : link.app.toLowerCase().includes('github') ? '🐙' : '🔗'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#0a0a0a]">{link.app}</p>
                            <p className="text-xs text-[#9ca3af]">{link.connected ? 'Connected!' : 'Click to connect'}</p>
                          </div>
                        </div>
                        {link.connected ? (
                          <span className="flex items-center gap-1 text-green-600 text-sm"><Check className="h-4 w-4" /> Connected</span>
                        ) : (
                          <a href={link.url} target="_blank" rel="noopener noreferrer" onClick={() => handleConnected(message.id, idx)}
                            className="flex items-center gap-1.5 rounded-lg bg-[#f26522] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#e55a1d] no-underline">
                            <ExternalLink className="h-3 w-3" /> Connect
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="chat-message flex gap-2.5 sm:gap-3">
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-[#f26522]">
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white animate-spin" />
                </div>
                <div className="rounded-2xl bg-[#f3f4f6] px-4 py-2.5 text-sm text-[#6b7280]">Thinking...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="border-t border-[#e5e7eb] bg-white safe-area-bottom">
        <form onSubmit={handleSubmit} className="mx-auto max-w-2xl px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-[#e5e7eb] bg-white px-2.5 sm:px-3 py-2 focus-within:border-[#d1d5db] focus-within:shadow-sm transition-all">
            <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9ca3af] active:bg-[#f3f4f6] hover:bg-[#f3f4f6] transition-colors shrink-0">
              <Paperclip className="h-4 w-4" />
            </button>
            <input
              ref={inputRef2}
              defaultValue=""
              placeholder="Ask anything..."
              className="flex-1 bg-transparent text-[15px] sm:text-sm text-[#0a0a0a] placeholder:text-[#9ca3af] focus:outline-none min-w-0"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0a0a0a] text-white active:bg-[#1a1a1a] disabled:opacity-40 transition-colors shrink-0"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
