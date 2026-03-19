'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Zap, Shield, Calendar, Plug, MessageSquare, Check, ArrowRight, Flame } from 'lucide-react';

const FEATURES = [
  { icon: Plug, title: '500+ Integrações', desc: 'Gmail, Notion, Slack, Linear e muito mais em um clique via OAuth seguro.' },
  { icon: Shield, title: 'Apenas OAuth', desc: 'Nunca pedimos sua senha. Tudo via OAuth. Revogue quando quiser.' },
  { icon: Zap, title: 'Zero Configuração', desc: 'Cadastre-se, converse, pronto. Sem API keys, sem arquivos de config.' },
  { icon: Calendar, title: 'Automações Agendadas', desc: 'Programe tarefas em linguagem natural. Roda sozinho 24/7.' },
  { icon: MessageSquare, title: 'Chat Natural', desc: 'Descreva o que quer fazer. Jungor entende o contexto e executa.' },
];

const COMPARISON = [
  { jungor: 'Setup em segundos', other: '30–60 min de configuração' },
  { jungor: 'OAuth gerenciado', other: 'API keys em texto puro' },
  { jungor: '500+ integrações', other: 'Config manual por app' },
  { jungor: 'Log completo de ações', other: 'Nenhuma rastreabilidade' },
  { jungor: 'Revogar em 1 clique', other: 'Caçar e deletar configs' },
];

const APPS = ['Gmail', 'Slack', 'GitHub', 'Notion', 'Linear', 'Stripe', 'Discord', 'Airtable', 'YouTube', 'Jira', 'Figma', 'HubSpot', 'Salesforce', 'Trello', 'Asana'];

const EXAMPLES = [
  { icon: '📧', text: 'Leia meus emails todo dia às 9h e organize no Notion' },
  { icon: '🐙', text: 'Quando abrir um PR no GitHub, poste no Slack do time' },
  { icon: '📊', text: 'Gere um relatório semanal do Linear e envie por email' },
  { icon: '💬', text: 'Resuma o canal #feedback do Slack e crie tarefas no Jira' },
  { icon: '📅', text: 'Me lembre de reuniões 15 minutos antes via mensagem' },
];

export function LandingClient() {
  return (
    <div className="min-h-screen bg-[#080809] text-white overflow-x-hidden">
      {/* Radial glow */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(242,101,34,0.12) 0%, transparent 70%)' }} />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/8" style={{ background: 'rgba(8,8,9,0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: 'linear-gradient(135deg, #f26522 0%, #ff8a50 100%)', boxShadow: '0 2px 10px rgba(242,101,34,0.4)' }}>
              <Flame className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight">Jungor</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="text-sm text-white/60 hover:text-white transition-colors px-3 py-1.5">
              Entrar
            </Link>
            <Link
              href="/sign-up"
              className="px-4 py-2 rounded-xl text-white font-semibold text-sm transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #f26522 0%, #e55a1d 100%)', boxShadow: '0 4px 14px rgba(242,101,34,0.35)' }}
            >
              Começar Grátis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-16 px-4 sm:px-6 text-center">
        <motion.div
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/60 mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          500+ apps disponíveis agora
        </motion.div>

        <motion.h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] mb-6 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          Sua IA que executa{' '}
          <span style={{ background: 'linear-gradient(135deg, #f26522 0%, #ff8a50 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            enquanto você dorme.
          </span>
        </motion.h1>

        <motion.p
          className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Conecte seus apps via OAuth, descreva o que quer automatizar, e deixe o Jungor fazer o resto — 24h por dia, 7 dias por semana.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-white font-semibold text-base transition-all hover:-translate-y-0.5 active:translate-y-0"
            style={{ background: 'linear-gradient(135deg, #f26522 0%, #e55a1d 100%)', boxShadow: '0 4px 20px rgba(242,101,34,0.4)' }}
          >
            Começar Grátis
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-white/70 font-medium text-base border border-white/10 hover:border-white/20 hover:text-white transition-all"
          >
            Já tenho conta
          </Link>
        </motion.div>

        {/* Social proof */}
        <motion.p
          className="mt-6 text-xs text-white/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Sem cartão de crédito · Grátis para começar
        </motion.p>
      </section>

      {/* App Marquee */}
      <section className="py-12 overflow-hidden">
        <p className="text-center text-xs text-white/30 uppercase tracking-widest mb-6 font-medium">Conecte com os apps que você já usa</p>
        <div className="relative">
          <div className="flex animate-marquee gap-4">
            {[...APPS, ...APPS].map((app, i) => (
              <div key={i} className="shrink-0 flex items-center gap-2 rounded-lg border border-white/8 bg-white/4 px-4 py-2.5">
                <span className="text-sm font-medium text-white/60">{app}</span>
              </div>
            ))}
          </div>
          <div className="absolute inset-y-0 left-0 w-20 pointer-events-none" style={{ background: 'linear-gradient(to right, #080809, transparent)' }} />
          <div className="absolute inset-y-0 right-0 w-20 pointer-events-none" style={{ background: 'linear-gradient(to left, #080809, transparent)' }} />
        </div>
      </section>

      {/* Demo / Examples */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">O que você pode automatizar</h2>
            <p className="text-white/50">Escreva em linguagem natural. Jungor entende e executa.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {EXAMPLES.map((ex, i) => (
              <motion.div
                key={i}
                className="rounded-xl border border-white/8 p-5 hover:border-white/15 transition-all"
                style={{ background: 'rgba(255,255,255,0.03)' }}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <span className="text-2xl mb-3 block">{ex.icon}</span>
                <p className="text-white/75 text-sm leading-relaxed font-mono">&ldquo;{ex.text}&rdquo;</p>
              </motion.div>
            ))}
            <motion.div
              className="rounded-xl border border-brand/20 p-5 flex items-center justify-center sm:col-span-2 lg:col-span-1"
              style={{ background: 'rgba(242,101,34,0.06)' }}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <Link href="/sign-up" className="text-brand font-semibold text-sm flex items-center gap-2 hover:gap-3 transition-all">
                Criar minha automação <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 border-t border-white/8">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            className="text-3xl sm:text-4xl font-bold text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Tudo que você precisa
          </motion.h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                className="rounded-xl border border-white/8 p-6 hover:border-white/15 transition-all group"
                style={{ background: 'rgba(255,255,255,0.03)' }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-4 transition-all group-hover:scale-110" style={{ background: 'rgba(242,101,34,0.15)' }}>
                  <f.icon className="h-5 w-5 text-[#f26522]" />
                </div>
                <h3 className="font-semibold text-base mb-2">{f.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-20 px-4 sm:px-6 border-t border-white/8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">Por que Jungor?</h2>
            <p className="text-white/50">Setup em segundos. Sem expor credenciais. Sem código local.</p>
          </motion.div>
          <motion.div
            className="rounded-2xl border border-white/8 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="grid grid-cols-2">
              <div className="px-6 py-4 font-semibold text-sm border-b border-white/8 text-white" style={{ background: 'rgba(242,101,34,0.12)' }}>
                ✦ Jungor
              </div>
              <div className="px-6 py-4 font-semibold text-sm border-b border-white/8 border-l border-white/8 text-white/40">
                Alternativas
              </div>
              {COMPARISON.map((row, i) => (
                <div key={i} className="contents">
                  <div className="px-6 py-3.5 border-b border-white/5 flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-[#f26522] shrink-0" />
                    <span className="text-white/85">{row.jungor}</span>
                  </div>
                  <div className="px-6 py-3.5 border-b border-white/5 border-l border-white/8 text-sm text-white/35">
                    {row.other}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-4 sm:px-6 border-t border-white/8 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(242,101,34,0.1) 0%, transparent 70%)' }} />
        <motion.div
          className="relative max-w-2xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Pronto para automatizar tudo?
          </h2>
          <p className="text-white/50 mb-10 text-lg">
            Configure em 60 segundos. Comece de graça.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg transition-all hover:-translate-y-1 active:translate-y-0"
            style={{ background: 'linear-gradient(135deg, #f26522 0%, #e55a1d 100%)', boxShadow: '0 6px 24px rgba(242,101,34,0.45)' }}
          >
            Começar Grátis
            <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 border-t border-white/8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-md" style={{ background: 'linear-gradient(135deg, #f26522 0%, #ff8a50 100%)' }}>
              <Flame className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-white/40 text-sm font-medium">Jungor</span>
          </div>
          <div className="flex gap-6">
            <Link href="/sign-in" className="text-sm text-white/40 hover:text-white/70 transition-colors">Entrar</Link>
            <Link href="/sign-up" className="text-sm text-white/40 hover:text-white/70 transition-colors">Cadastrar</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
