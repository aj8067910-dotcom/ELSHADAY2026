'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { GamificationSummary, Me } from '@/lib/types';
import { Avatar, GlassCard, Spinner, XpBar } from '@/components/ui';

const AREA_LABELS: Record<string, string> = {
  PALAVRA: '📖 Palavra',
  ORACAO: '🙏 Oração',
  SERVICO: '❤️ Serviço',
  COMUNHAO: '🤝 Comunhão',
  EVANGELISMO: '🌍 Evangelismo',
  ADORACAO: '🎵 Adoração',
};

export default function PerfilPage() {
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<Me>('/users/me'),
  });
  const { data: summary } = useQuery({
    queryKey: ['gamification'],
    queryFn: () => api<GamificationSummary>('/gamification/me'),
  });

  if (!me || !summary) return <Spinner />;

  // radar de constância: intensidade relativa por área (hábitos, não fé)
  const maxAreaXp = Math.max(1, ...summary.growthTree.map((g) => g.xp));

  return (
    <div className="space-y-4">
      {/* header do perfil */}
      <GlassCard className="overflow-hidden p-0">
        <div className="h-24 bg-gold-gradient opacity-30" />
        <div className="-mt-10 px-5 pb-5">
          <Avatar
            name={me.name}
            src={me.avatarUrl}
            size={80}
            className="ring-4 ring-ink-900"
          />
          <h1 className="mt-3 font-display text-xl font-bold">{me.name}</h1>
          {me.nickname && <p className="text-sm text-zinc-400">@{me.nickname}</p>}
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-gold-500/20 bg-gold-500/[0.07] px-3 py-1 font-medium text-gold-300">
              Nível {me.level.level} · {me.level.title}
            </span>
            {me.team && (
              <span
                className="rounded-full px-3 py-1 font-medium"
                style={{
                  color: me.team.color,
                  backgroundColor: `${me.team.color}15`,
                  border: `1px solid ${me.team.color}30`,
                }}
              >
                {me.team.name}
              </span>
            )}
            <span className="rounded-full border border-white/10 px-3 py-1 text-zinc-400">
              {me.role}
            </span>
          </div>
          {me.bio && <p className="mt-3 text-sm text-zinc-300">{me.bio}</p>}
          {me.favoriteVerse && (
            <p className="mt-2 text-sm italic text-zinc-400">
              “{me.favoriteVerse}”
            </p>
          )}
        </div>
      </GlassCard>

      {/* progresso */}
      <GlassCard delay={0.05}>
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-zinc-400">Progresso do nível</span>
          <span className="font-display font-bold gold-text">
            {me.xpTotal.toLocaleString('pt-BR')} XP
          </span>
        </div>
        <XpBar progress={summary.level.progress} />
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-2xl bg-white/[0.03] p-3">
            <p className="font-display text-xl font-bold">🔥 {summary.streak.current}</p>
            <p className="text-xs text-zinc-500">streak atual</p>
          </div>
          <div className="rounded-2xl bg-white/[0.03] p-3">
            <p className="font-display text-xl font-bold">🏆 {summary.streak.longest}</p>
            <p className="text-xs text-zinc-500">melhor streak</p>
          </div>
          <div className="rounded-2xl bg-white/[0.03] p-3">
            <p className="font-display text-xl font-bold">🏅 {summary.badges.length}</p>
            <p className="text-xs text-zinc-500">conquistas</p>
          </div>
        </div>
      </GlassCard>

      {/* radar espiritual (constância por área) */}
      <GlassCard delay={0.1}>
        <h2 className="mb-1 font-display text-sm font-semibold uppercase tracking-widest text-zinc-400">
          Radar de constância
        </h2>
        <p className="mb-4 text-xs text-zinc-600">
          Acompanha hábitos, não mede fé. 💛
        </p>
        <div className="space-y-3">
          {Object.entries(AREA_LABELS).map(([key, label]) => {
            const xp = summary.growthTree.find((g) => g.area === key)?.xp ?? 0;
            return (
              <div key={key}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{label}</span>
                  <span className="text-zinc-500">{xp} XP</span>
                </div>
                <XpBar progress={xp / maxAreaXp} />
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* badges */}
      <GlassCard delay={0.15}>
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-widest text-zinc-400">
          Conquistas
        </h2>
        {summary.badges.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {summary.badges.map((b) => (
              <div
                key={b.code}
                className="rounded-2xl border border-gold-500/15 bg-gold-500/[0.05] p-3 text-center"
              >
                <span className="text-2xl">🏅</span>
                <p className="mt-1 text-xs font-medium text-gold-300">{b.name}</p>
                <p className="text-[10px] text-zinc-600">
                  {new Date(b.earnedAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">
            Suas conquistas aparecerão aqui. Comece pelo devocional de hoje! ✨
          </p>
        )}
      </GlassCard>
    </div>
  );
}
