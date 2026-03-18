'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useState } from 'react';
import { Calendar, MessageCircle, BarChart3, ChevronUp } from 'lucide-react';

const PROMPT_CARDS = [
  {
    icon: Calendar,
    title: 'Block time for deep work',
    prompt: 'Block 2 hours for deep work on my calendar tomorrow morning',
    users: '788+',
  },
  {
    icon: MessageCircle,
    title: 'Catch up on Slack',
    prompt: 'Summarize my unread Slack messages from the last 3 days',
    users: '1.2k+',
  },
  {
    icon: BarChart3,
    title: 'Last 10 tweet performance report',
    prompt: 'Get my last 10 tweets from X and create a performance report in Google Sheets',
    users: '456+',
  },
];

export function HomeClient() {
  const router = useRouter();
  const { user } = useUser();
  const [input, setInput] = useState('');

  const firstName = user?.firstName ?? 'there';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: text.slice(0, 50) }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.session?.id) {
          router.push(`/chat?session=${data.session.id}&message=${encodeURIComponent(text)}`);
        } else {
          router.push(`/chat?message=${encodeURIComponent(text)}`);
        }
      })
      .catch(() => router.push(`/chat`));
  };

  const handleTryPrompt = (prompt: string) => {
    fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: prompt.slice(0, 50) }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.session?.id) {
          router.push(`/chat?session=${data.session.id}&message=${encodeURIComponent(prompt)}`);
        } else {
          router.push(`/chat?message=${encodeURIComponent(prompt)}`);
        }
      })
      .catch(() => router.push(`/chat`));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-4 py-12">
      <h1 className="text-3xl sm:text-4xl font-semibold text-[#0a0a0a] mb-2 text-center">
        Hello there, {firstName}!
      </h1>

      <form onSubmit={handleSubmit} className="w-full max-w-2xl mt-6">
        <div className="flex items-center gap-2 rounded-2xl border-2 border-[#e5e7eb] bg-white px-4 py-3 focus-within:border-[#f26522] focus-within:ring-2 focus-within:ring-[#f26522]/20 transition-all">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9ca3af] hover:bg-[#f3f4f6] shrink-0"
          >
            +
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Hey Rube, can you..."
            className="flex-1 bg-transparent text-base text-[#0a0a0a] placeholder:text-[#9ca3af] focus:outline-none min-w-0"
          />
          <button
            type="submit"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0a0a0a] text-white hover:bg-[#1a1a1a] shrink-0"
          >
            →
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl mt-10">
        {PROMPT_CARDS.map((card, i) => (
          <div
            key={i}
            className="rounded-xl border border-[#e5e7eb] bg-white p-4 hover:border-[#d1d5db] hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f26522]/10">
                <card.icon className="h-5 w-5 text-[#f26522]" />
              </div>
              <h3 className="text-sm font-medium text-[#0a0a0a]">{card.title}</h3>
            </div>
            <p className="text-xs text-[#6b7280] mb-3 line-clamp-2">{card.prompt}</p>
            <button
              type="button"
              onClick={() => handleTryPrompt(card.prompt)}
              className="flex items-center gap-1.5 text-xs font-medium text-[#f26522] hover:underline"
            >
              Try Prompt
            </button>
            <span className="ml-2 text-[10px] text-[#9ca3af]">{card.users} Users</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => router.push('/chat')}
        className="mt-12 flex items-center gap-2 text-sm font-medium text-[#6b7280] hover:text-[#0a0a0a] transition-colors"
      >
        Explore Usecases
        <ChevronUp className="h-4 w-4 rotate-180" />
      </button>
    </div>
  );
}
