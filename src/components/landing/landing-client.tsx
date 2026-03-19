'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  Zap,
  Shield,
  Calendar,
  MessageSquare,
  Check,
  ArrowRight,
  Flame,
  Github,
  Slack,
  Mail,
  Database,
  Figma,
  Trello,
  Lock,
  Clock,
  TerminalSquare,
  Sparkles,
  Layers,
  BarChart,
  User,
  X,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

// --- SVGs for Marquee ---
const MARQUEE_ITEMS = [
  { name: 'GitHub', icon: Github, color: '#ffffff' },
  { name: 'Slack', icon: Slack, color: '#E01E5A' },
  { name: 'Gmail', icon: Mail, color: '#EA4335' },
  { name: 'Supabase', icon: Database, color: '#3ECF8E' },
  { name: 'Figma', icon: Figma, color: '#F24E1E' },
  { name: 'Trello', icon: Trello, color: '#0052CC' },
];

// --- Mockup Chat Data ---
const CHAT_SEQUENCE = [
  { role: 'user', text: 'Read my emails every day at 9 AM and summarize them in Notion.' },
  { role: 'assistant', text: 'I have set up a daily schedule for 9:00 AM. I will read your Gmail and append a summary to your Notion database.', tools: ['Gmail', 'Notion'] }
];

const COMPARISON = [
  { jungor: 'Setup in seconds', other: '30–60 minutes of configuration' },
  { jungor: 'Managed OAuth', other: 'Plaintext API keys' },
  { jungor: '500+ integrations', other: 'Manual setup per app' },
  { jungor: 'Full execution logs', other: 'No traceability' },
  { jungor: 'Revoke in one click', other: 'Hunt and delete configs' },
];

// --- Spotlight Card Component ---
function SpotlightCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const divRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current || isFocused) return;
    const div = divRef.current;
    const rect = div.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleFocus = () => {
    setIsFocused(true);
    setOpacity(1);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setOpacity(0);
  };

  const handleMouseEnter = () => {
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-8 transition-colors hover:border-white/20',
        className
      )}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(242,101,34,.15), transparent 40%)`,
        }}
      />
      {children}
    </div>
  );
}

// --- Tabs Component ---
const USE_CASES = [
  {
    id: 'dev',
    label: 'Developers',
    icon: TerminalSquare,
    prompt: 'When a PagerDuty alert triggers, create an incident channel in Slack and page the on-call engineer.',
    tools: ['PagerDuty', 'Slack']
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: Sparkles,
    prompt: 'Monitor Twitter for brand mentions and add negative sentiment tweets to a Linear issue.',
    tools: ['Twitter', 'Linear']
  },
  {
    id: 'sales',
    label: 'Sales',
    icon: BarChart,
    prompt: 'When a new Stripe subscription is created, send a welcome email and alert the sales team.',
    tools: ['Stripe', 'Gmail', 'Slack']
  },
  {
    id: 'personal',
    label: 'Personal',
    icon: User,
    prompt: 'Every Friday at 5 PM, compile my completed tasks from GitHub and draft a weekly update.',
    tools: ['GitHub', 'Notion']
  }
];

// --- Main Page Component ---
export function LandingClient() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -100]);

  const [activeTab, setActiveTab] = useState(USE_CASES[0].id);

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-brand selection:text-white overflow-hidden">
      {/* Dynamic Background Mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand/20 blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[20%] right-[-10%] w-[30%] h-[40%] rounded-full bg-[#ff8a50]/10 blur-[100px] mix-blend-screen animate-pulse" style={{ animationDuration: '12s', animationDelay: '1s' }} />
        <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] rounded-full bg-brand/10 blur-[150px] mix-blend-screen animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#050505]/60 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-[#ff8a50] shadow-[0_0_20px_rgba(242,101,34,0.3)] group-hover:shadow-[0_0_25px_rgba(242,101,34,0.5)] transition-all">
              <Flame className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Jungor</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="text-sm font-medium text-white/60 hover:text-white transition-colors px-2">
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="relative inline-flex h-9 items-center justify-center rounded-full px-5 py-2 text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #f26522 0%, #e55a1d 100%)',
                boxShadow: '0 4px 14px rgba(242,101,34,0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
              }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="relative pt-40 pb-20 px-6 sm:pt-48 sm:pb-32">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 lg:gap-8 items-center">
            {/* Left Copy */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-sm font-medium text-brand mb-8 backdrop-blur-md">
                <Sparkles className="h-4 w-4" />
                <span>The Future of Automation</span>
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
                Your AI that executes <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand via-[#ff8a50] to-[#f26522]">
                  while you sleep.
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-white/50 mb-10 leading-relaxed max-w-xl">
                Connect your apps via secure OAuth, describe your workflows in natural language, and let Jungor handle the heavy lifting. 24/7 autonomous execution.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link
                  href="/sign-up"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-white font-bold text-lg transition-all hover:scale-105 active:scale-95 group relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #f26522 0%, #e55a1d 100%)', boxShadow: '0 8px 32px rgba(242,101,34,0.4)' }}
                >
                  <span className="relative z-10">Start Automating Free</span>
                  <ArrowRight className="h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                </Link>
                <p className="text-sm text-white/40 mt-3 sm:mt-0 sm:ml-2">No credit card required.</p>
              </div>
            </motion.div>

            {/* Right Mockup */}
            <motion.div
              style={{ y: y1 }}
              initial={{ opacity: 0, scale: 0.9, rotateX: 10, rotateY: -10 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0, rotateY: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative perspective-[2000px]"
            >
              <div className="relative rounded-2xl border border-white/10 bg-[#0A0A0A]/80 backdrop-blur-xl shadow-2xl overflow-hidden"
                   style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)' }}>
                {/* Mockup Header */}
                <div className="h-12 border-b border-white/5 flex items-center px-4 gap-2 bg-white/[0.02]">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="mx-auto flex items-center gap-2 text-xs font-medium text-white/40">
                    <Lock className="h-3 w-3" /> jungor.dev
                  </div>
                </div>
                {/* Mockup Body */}
                <div className="p-6 space-y-6">
                  {/* User Message */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="flex gap-4 justify-end"
                  >
                    <div className="bg-gradient-to-br from-brand to-[#e55a1d] text-white p-4 rounded-2xl rounded-tr-sm max-w-[85%] text-sm shadow-lg leading-relaxed">
                      {CHAT_SEQUENCE[0].text}
                    </div>
                  </motion.div>
                  {/* Assistant Message */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2 }}
                    className="flex gap-4"
                  >
                    <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center shrink-0 shadow-lg mt-1">
                      <Flame className="w-4 h-4 text-white" />
                    </div>
                    <div className="space-y-3 flex-1">
                      {/* Tool Calls */}
                      <div className="flex gap-2">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 2.2 }}
                          className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-xs text-white/80"
                        >
                          <Loader2 className="w-3 h-3 animate-spin text-brand" />
                          Connecting Gmail...
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 3.5 }}
                          className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1.5 text-xs text-green-400"
                        >
                          <Check className="w-3 h-3" />
                          Notion Authorized
                        </motion.div>
                      </div>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 4 }}
                        className="text-white/80 text-sm leading-relaxed"
                      >
                        {CHAT_SEQUENCE[1].text}
                      </motion.div>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Decorative Floating Elements */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-12 top-10 bg-white/10 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-xl flex items-center gap-3"
              >
                <div className="bg-[#EA4335]/20 p-2 rounded-lg"><Mail className="w-5 h-5 text-[#EA4335]" /></div>
                <div>
                  <p className="text-xs font-bold text-white">Gmail</p>
                  <p className="text-[10px] text-green-400">Connected</p>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -left-8 bottom-20 bg-white/10 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-xl flex items-center gap-3"
              >
                <div className="bg-white/20 p-2 rounded-lg"><Layers className="w-5 h-5 text-white" /></div>
                <div>
                  <p className="text-xs font-bold text-white">Notion</p>
                  <p className="text-[10px] text-green-400">Syncing...</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Marquee Section */}
        <section className="py-10 border-y border-white/5 bg-white/[0.01] relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#050505] to-transparent z-10" />
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#050505] to-transparent z-10" />
          
          <div className="flex gap-8 items-center w-max animate-marquee whitespace-nowrap">
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 px-6 py-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
                <item.icon className="w-6 h-6" style={{ color: item.color }} />
                <span className="text-base font-semibold text-white/70">{item.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Bento Grid: How it Works */}
        <section className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-3xl sm:text-5xl font-bold mb-6 tracking-tight">Built for speed and security.</h2>
              <p className="text-lg text-white/50 max-w-2xl mx-auto">
                No complex visual builders. No managing API keys. Just talk to Jungor and watch your apps work together.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[320px]">
              {/* Card 1: OAuth */}
              <SpotlightCard className="md:col-span-1 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6">
                    <Shield className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">OAuth Only</h3>
                  <p className="text-white/50 leading-relaxed">
                    We never see your passwords. Connect apps securely via official OAuth flows and revoke access anytime with one click.
                  </p>
                </div>
              </SpotlightCard>

              {/* Card 2: Scheduled */}
              <SpotlightCard className="md:col-span-2 flex flex-col justify-between relative overflow-hidden group">
                <div className="relative z-10 max-w-md">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6">
                    <Clock className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Scheduled Automations</h3>
                  <p className="text-white/50 leading-relaxed">
                    "Every Monday at 9AM", "When a new row is added", or "Every 15 minutes". Jungor runs autonomously in the background.
                  </p>
                </div>
                {/* Abstract animated clock bg */}
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute -right-20 -bottom-20 w-80 h-80 border-[40px] border-white/5 rounded-full pointer-events-none group-hover:border-purple-500/10 transition-colors duration-700" 
                />
              </SpotlightCard>

              {/* Card 3: Zero Config */}
              <SpotlightCard className="md:col-span-3 flex flex-col sm:flex-row items-center gap-10">
                <div className="flex-1">
                  <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center mb-6">
                    <Zap className="w-6 h-6 text-brand" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Zero Configuration</h3>
                  <p className="text-white/50 leading-relaxed max-w-xl">
                    Stop dragging boxes and connecting nodes. Just tell Jungor what you want in plain English. We handle the API schemas, pagination, and error retries.
                  </p>
                </div>
                <div className="flex-1 w-full bg-[#0A0A0A] rounded-2xl border border-white/10 p-6 font-mono text-sm text-white/70 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand to-transparent opacity-50" />
                  <p className="text-green-400 mb-2">// Old way</p>
                  <p className="opacity-50 line-through">const res = await fetch('/api/v1/webhook', ...)</p>
                  <p className="opacity-50 line-through">const data = parseData(res)</p>
                  <p className="opacity-50 line-through">await slack.sendMessage(data)</p>
                  <div className="h-px w-full bg-white/10 my-4" />
                  <p className="text-brand mb-2">// Jungor way</p>
                  <p className="text-white">"Watch the webhook and send the data to Slack."</p>
                </div>
              </SpotlightCard>
            </div>
          </div>
        </section>

        {/* Use Cases (Tabs) */}
        <section className="py-32 px-6 border-t border-white/5 bg-white/[0.01]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-5xl font-bold mb-6 tracking-tight">Endless possibilities.</h2>
              <p className="text-lg text-white/50">One platform to automate every department.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
              {/* Tabs list */}
              <div className="lg:w-1/3 flex flex-col gap-2">
                {USE_CASES.map((uc) => (
                  <button
                    key={uc.id}
                    onClick={() => setActiveTab(uc.id)}
                    className={cn(
                      'flex items-center gap-4 px-6 py-4 rounded-2xl text-left transition-all',
                      activeTab === uc.id
                        ? 'bg-white/10 border border-white/20 shadow-lg'
                        : 'hover:bg-white/5 border border-transparent opacity-60 hover:opacity-100'
                    )}
                  >
                    <uc.icon className={cn('w-6 h-6', activeTab === uc.id ? 'text-brand' : 'text-white')} />
                    <span className="text-lg font-semibold">{uc.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="lg:w-2/3">
                <AnimatePresence mode="wait">
                  {USE_CASES.map(
                    (uc) =>
                      activeTab === uc.id && (
                        <motion.div
                          key={uc.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                          className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 sm:p-12 h-full flex flex-col justify-center relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 p-8 opacity-10">
                            <uc.icon className="w-48 h-48" />
                          </div>
                          <div className="relative z-10">
                            <div className="flex gap-3 mb-8">
                              {uc.tools.map(t => (
                                <span key={t} className="px-4 py-1.5 rounded-full bg-white/10 text-sm font-medium border border-white/10 backdrop-blur-md">
                                  {t}
                                </span>
                              ))}
                            </div>
                            <h3 className="text-2xl sm:text-3xl font-medium leading-relaxed text-white/90">
                              "{uc.prompt}"
                            </h3>
                          </div>
                        </motion.div>
                      )
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-32 px-6 border-t border-white/5">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-bold mb-16 text-center tracking-tight">The Modern Alternative</h2>
            <div className="rounded-3xl border border-white/10 overflow-hidden bg-white/[0.02]">
              <div className="grid grid-cols-2 text-sm sm:text-base">
                <div className="p-6 sm:p-8 font-bold text-white border-b border-r border-white/10 bg-brand/5">
                  Jungor
                </div>
                <div className="p-6 sm:p-8 font-bold text-white/40 border-b border-white/10">
                  Legacy Automations (Zapier, Make)
                </div>
                
                {COMPARISON.map((row, i) => (
                  <React.Fragment key={i}>
                    <div className="p-6 sm:p-8 border-b border-r border-white/10 flex items-center gap-3 bg-brand/[0.02]">
                      <div className="w-6 h-6 rounded-full bg-brand/20 flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 text-brand" />
                      </div>
                      <span className="font-medium">{row.jungor}</span>
                    </div>
                    <div className="p-6 sm:p-8 border-b border-white/10 flex items-center gap-3 text-white/40">
                      <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                        <X className="w-4 h-4 text-white/20" />
                      </div>
                      <span>{row.other}</span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative py-40 px-6 border-t border-white/5 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(242,101,34,0.15) 0%, transparent 60%)' }} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative max-w-3xl mx-auto text-center"
          >
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand to-[#ff8a50] mx-auto flex items-center justify-center shadow-[0_0_40px_rgba(242,101,34,0.5)] mb-8">
              <Flame className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl sm:text-6xl font-bold mb-6 tracking-tight">
              Ready to automate everything?
            </h2>
            <p className="text-xl text-white/50 mb-12">
              Join thousands of professionals saving hours every week. Setup takes less than 60 seconds.
            </p>
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center gap-2 px-10 py-5 rounded-full text-white font-bold text-xl transition-all hover:scale-105 active:scale-95 group relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #f26522 0%, #e55a1d 100%)', boxShadow: '0 10px 40px rgba(242,101,34,0.5)' }}
            >
              <span className="relative z-10">Create Free Account</span>
              <ArrowRight className="h-6 w-6 relative z-10 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            </Link>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-6 border-t border-white/10 bg-[#020202]">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Flame className="w-5 h-5 text-brand" />
              <span className="font-semibold text-white/80">Jungor</span>
              <span className="text-white/30 text-sm pl-2 border-l border-white/10">© {new Date().getFullYear()}</span>
            </div>
            <div className="flex gap-8 text-sm font-medium text-white/40">
              <Link href="/sign-in" className="hover:text-white transition-colors">Sign In</Link>
              <Link href="/sign-up" className="hover:text-white transition-colors">Sign Up</Link>
              <a href="https://docs.composio.dev" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Documentation</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
