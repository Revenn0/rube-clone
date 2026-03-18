'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Zap,
  Shield,
  Calendar,
  Plug,
  MessageSquare,
  Check,
  ArrowRight,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Plug,
    title: '1000+ Integrações',
    desc: 'Conecte Gmail, Notion, Slack, Linear e muito mais em um clique.',
  },
  {
    icon: Shield,
    title: 'Apenas OAuth',
    desc: 'Conecte via OAuth. Nenhuma senha armazenada ou compartilhada.',
  },
  {
    icon: Zap,
    title: 'Zero Configuração',
    desc: 'Cadastre-se, converse, pronto. Sem API keys ou arquivos de config.',
  },
  {
    icon: Calendar,
    title: 'Funciona Enquanto Você Dorme',
    desc: 'Agende tarefas e deixe o Rube executá-las no piloto automático.',
  },
  {
    icon: MessageSquare,
    title: 'Chat Inteligente',
    desc: 'Converse em linguagem natural. O Rube entende e executa.',
  },
];

const EXAMPLES = [
  'Verifique meu Gmail, categorize reclamações e coloque no Notion...',
  'Resuma todas as mensagens do Slack em #feedback desta semana...',
  'Puxe os tickets do Linear desta sprint e rascunhe release notes...',
  'Analise nossa tabela user_events no Supabase, identifique drop-offs...',
  'Leia meus emails todos os dias às 9h e organize no Notion...',
];

const COMPARISON = [
  { rube: 'Segundos', other: '30-60 min de setup' },
  { rube: 'OAuth gerenciado', other: 'API keys em plaintext' },
  { rube: '500+ integrações', other: 'Config manual por app' },
  { rube: 'Log completo de ações', other: 'Nenhum' },
  { rube: 'Revogar em um clique', other: 'Procurar e deletar configs' },
];

export function LandingClient() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Rube
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className="text-sm text-white/70 hover:text-white transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/sign-up"
              className="px-4 py-2 rounded-lg bg-[#f26522] hover:bg-[#e55a1d] text-white font-medium text-sm transition-colors"
            >
              Começar Grátis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Sua IA que faz coisas{' '}
            <span className="text-[#f26522]">enquanto você dorme.</span>
          </motion.h1>
          <motion.p
            className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Rube é um assistente 24/7 com centenas de ferramentas via OAuth.
            Conecte seus apps e automatize fluxos em linguagem natural.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#f26522] hover:bg-[#e55a1d] text-white font-semibold text-lg transition-colors"
            >
              Começar Agora
              <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Demo Card */}
      <section className="px-4 pb-24">
        <motion.div
          className="max-w-3xl mx-auto rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-sm"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-2 text-sm text-white/50 mb-4">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Rube em ação
          </div>
          <p className="text-white/80 mb-6 font-mono text-sm sm:text-base">
            &quot;todos os dias 9 da manhã, leia meus emails e coloque no notion&quot;
          </p>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-white/70">
              <Check className="h-4 w-4 text-green-500 shrink-0" />
              Frequência: Diariamente
            </div>
            <div className="flex items-center gap-2 text-white/70">
              <Check className="h-4 w-4 text-green-500 shrink-0" />
              Horário: 09:00
            </div>
            <div className="flex items-center gap-2 text-white/70">
              <Check className="h-4 w-4 text-green-500 shrink-0" />
              Ação: Gmail → Notion
            </div>
          </div>
          <p className="mt-4 text-white/50 text-sm">
            O Rube entende linguagem natural e preenche automaticamente o agendamento.
          </p>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            className="text-3xl sm:text-4xl font-bold text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Tudo que você precisa
          </motion.h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                className="rounded-xl border border-white/10 bg-white/5 p-6 hover:border-white/20 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="h-10 w-10 rounded-lg bg-[#f26522]/20 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-[#f26522]" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-white/60 text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-24 px-4 border-t border-white/10">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            className="text-3xl sm:text-4xl font-bold text-center mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Por que Rube?
          </motion.h2>
          <motion.p
            className="text-white/60 text-center mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Setup em segundos. Sem expor credenciais. Sem código local.
          </motion.p>
          <motion.div
            className="rounded-xl border border-white/10 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="grid grid-cols-2">
              <div className="bg-[#f26522]/10 px-6 py-4 font-semibold border-b border-white/10">
                Rube
              </div>
              <div className="bg-white/5 px-6 py-4 font-semibold border-b border-white/10 border-l border-white/10">
                Alternativas
              </div>
              {COMPARISON.map((row, i) => (
                <div key={i} className="contents">
                  <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                    {row.rube}
                  </div>
                  <div className="px-6 py-4 border-b border-white/5 border-l border-white/10 text-white/60">
                    {row.other}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Examples Carousel */}
      <section className="py-24 px-4 border-t border-white/10 overflow-hidden">
        <motion.h2
          className="text-3xl sm:text-4xl font-bold text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Seus apps favoritos. Zero setup.
        </motion.h2>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide max-w-6xl mx-auto">
          {[...EXAMPLES, ...EXAMPLES].map((ex, i) => (
            <motion.div
              key={i}
              className="shrink-0 w-80 rounded-xl border border-white/10 bg-white/5 p-5 hover:border-white/20 transition-colors"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: (i % EXAMPLES.length) * 0.1 }}
            >
              <p className="text-white/80 text-sm leading-relaxed">{ex}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-4 border-t border-white/10">
        <motion.div
          className="max-w-2xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Pronto para conhecer seu assistente?
          </h2>
          <p className="text-white/60 mb-8">
            Sua IA está esperando. Configure em segundos.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#f26522] hover:bg-[#e55a1d] text-white font-semibold text-lg transition-colors"
          >
            Começar Grátis
            <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-white/50 text-sm">Rube — Connect anything to anything</span>
          <div className="flex gap-6">
            <Link href="/sign-in" className="text-sm text-white/50 hover:text-white/80">
              Entrar
            </Link>
            <Link href="/sign-up" className="text-sm text-white/50 hover:text-white/80">
              Cadastrar
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
