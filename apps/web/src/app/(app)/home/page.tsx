'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BookOpen, CalendarDays, ChevronRight, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import type {
  ChurchEvent,
  Devotional,
  GamificationSummary,
  Me,
  Mission,
} from '@/lib/types';
import { Avatar, GlassCard, StreakFlame, XpBar, Spinner } from '@/components/ui';

const AREA_LABELS: Record<string, string> = {
  PALAVRA: '📖 Palavra',
  ORACAO: '🙏 Oração',
  SERVICO: '❤️ Serviço',
  COMUNHAO: '🤝 Comunhão',
  EVANGELISMO: '🌍 Evangelismo',
  ADORACAO: '🎵 Adoração',
};

export default function HomePage() {
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<Me>('/users/me'),
  });
  const { data: summary } = useQuery({
    queryKey: ['gamification'],
    queryFn: () => api<GamificationSummary>('/gamification/me'),
  });
  const { data: devotional } = useQuery({
    queryKey: ['devotional-today'],
    queryFn: () => api<Devotional | null>('/devotionals/today'),
  });
  const { data: missions } = useQuery({
    queryKey: ['missions-daily'],
    queryFn: () => api<Mission[]>('/missions/daily'),
  });
  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: () => api<ChurchEvent[]>('/events'),
  });
  const { data: birthdays } = useQuery({
    queryKey: ['birthdays'],
    queryFn: () =>
      api<Array<{ id: string; name: string; avatarUrl?: string }>>(
        '/users/birthdays/today',
      ),
  });

  if (!me || !summary) return <Spinner />;

  const firstName = (me.nickname || me.name).split(' ')[0];
  const nextEvent = events?.find((e) => new Date(e.startsAt) > new Date());
  const missionsDone = missions?.filter((m) => m.completed).length ?? 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div className="space-y-4">
      {/* saudação */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-between"
      >
        <div>
          <p className="text-sm text-zinc-400">
            {greeting}, <span className="text-zinc-200">{firstName}</span> 👋
          </p>
          <h1 className="font-display text-2xl font-bold">
            Que bom te ver <span className="gold-text">hoje</span>.
          </h1>
        </div>
        <Link href="/perfil">
          <Avatar name={me.name} src={me.avatarUrl} size={48} />
        </Link>
      </motion.header>

      {/* streak + nível */}
      <GlassCard className="glass-hover" delay={0.05}>
        <div className="flex items-center justify-between gap-4">
          <StreakFlame days={summary.streak.current} />
          <div className="flex-1">
            <div className="mb-1 flex items-baseline justify-between">
              <span className="font-display text-sm font-semibold text-gold-300">
                Nível {summary.level.level} · {summary.level.title}
              </span>
              <span className="text-xs text-zinc-500">
                {summary.xpTotal.toLocaleString('pt-BR')} XP
              </span>
            </div>
            <XpBar progress={summary.level.progress} />
            <p className="mt-1.5 text-xs text-zinc-500">
              {summary.level.xpForNext - summary.level.xpIntoLevel} XP para o
              próximo nível
            </p>
          </div>
        </div>
      </GlassCard>

      {/* aniversariantes */}
      {birthdays && birthdays.length > 0 && (
        <GlassCard delay={0.08} className="border-gold-500/20">
          {birthdays.map((b) => (
            <div key={b.id} className="flex items-center gap-3">
              <span className="text-2xl">🎂</span>
              <p className="flex-1 text-sm">
                Hoje é aniversário de{' '}
                <span className="font-semibold text-gold-300">{b.name}</span>!
              </p>
              <Link href="/mural" className="btn-ghost px-3 py-1.5 text-xs">
                Enviar mensagem
              </Link>
            </div>
          ))}
        </GlassCard>
      )}

      {/* devocional do dia */}
      <Link href="/devocional" className="block">
        <GlassCard className="glass-hover" delay={0.1}>
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-gold-500/10 p-3 text-gold-400">
              <BookOpen size={22} />
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-widest text-zinc-500">
                Devocional de hoje
              </p>
              {devotional ? (
                <>
                  <h2 className="mt-0.5 font-display font-semibold">
                    {devotional.theme}
                  </h2>
                  <p className="mt-1 text-sm italic text-zinc-400">
                    “{devotional.verse.slice(0, 90)}
                    {devotional.verse.length > 90 ? '…' : ''}” —{' '}
                    {devotional.verseRef}
                  </p>
                  {devotional.completedByMe ? (
                    <span className="mt-2 inline-block rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                      ✓ Concluído hoje
                    </span>
                  ) : (
                    <span className="mt-2 inline-block rounded-full bg-gold-500/10 px-3 py-1 text-xs font-medium text-gold-300">
                      +20 XP te esperando
                    </span>
                  )}
                </>
              ) : (
                <p className="mt-1 text-sm text-zinc-400">
                  O devocional de hoje ainda não foi publicado.
                </p>
              )}
            </div>
            <ChevronRight className="mt-1 text-zinc-600" size={18} />
          </div>
        </GlassCard>
      </Link>

      {/* missões do dia */}
      <Link href="/missoes" className="block">
        <GlassCard className="glass-hover" delay={0.15}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-zinc-500">
                Missões do dia
              </p>
              <h2 className="mt-0.5 font-display font-semibold">
                {missionsDone} de {missions?.length ?? 0} concluídas
              </h2>
            </div>
            <div className="flex -space-x-1">
              {missions?.slice(0, 5).map((m) => (
                <span
                  key={m.id}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs ${
                    m.completed
                      ? 'border-gold-500/40 bg-gold-500/20'
                      : 'border-white/10 bg-ink-700'
                  }`}
                >
                  {m.completed ? '✓' : '·'}
                </span>
              ))}
            </div>
          </div>
          {missions && missions.length > 0 && (
            <div className="mt-3">
              <XpBar progress={missionsDone / missions.length} />
            </div>
          )}
        </GlassCard>
      </Link>

      {/* próximo evento */}
      {nextEvent && (
        <Link href="/eventos" className="block">
          <GlassCard className="glass-hover" delay={0.2}>
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-violet-500/10 p-3 text-violet-400">
                <CalendarDays size={22} />
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-widest text-zinc-500">
                  Próximo encontro
                </p>
                <h2 className="mt-0.5 font-display font-semibold">
                  {nextEvent.title}
                </h2>
                <p className="text-sm text-zinc-400">
                  {new Date(nextEvent.startsAt).toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {nextEvent.location ? ` · ${nextEvent.location}` : ''}
                </p>
              </div>
              <ChevronRight className="text-zinc-600" size={18} />
            </div>
          </GlassCard>
        </Link>
      )}

      {/* árvore de crescimento */}
      <GlassCard delay={0.25}>
        <div className="mb-3 flex items-center gap-2">
          <Sparkles size={16} className="text-gold-400" />
          <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-zinc-400">
            Sua árvore de crescimento
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Object.entries(AREA_LABELS).map(([key, label]) => {
            const xp =
              summary.growthTree.find((g) => g.area === key)?.xp ?? 0;
            return (
              <div
                key={key}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3"
              >
                <p className="text-sm">{label}</p>
                <p className="mt-1 font-display text-lg font-bold gold-text">
                  {xp} <span className="text-xs font-normal">XP</span>
                </p>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* badges recentes */}
      {summary.badges.length > 0 && (
        <GlassCard delay={0.3}>
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-widest text-zinc-400">
            Conquistas recentes
          </h2>
          <div className="flex flex-wrap gap-2">
            {summary.badges.slice(0, 6).map((b) => (
              <span
                key={b.code}
                className="rounded-full border border-gold-500/20 bg-gold-500/[0.07] px-3 py-1.5 text-xs font-medium text-gold-300"
              >
                🏅 {b.name}
              </span>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
