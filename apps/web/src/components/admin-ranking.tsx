'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { RankingEntry } from '@/lib/types';
import { Avatar, Chip, GlassCard } from '@/components/ui';

const PODIUM = ['🥇', '🥈', '🥉'];

export function AdminRanking() {
  const [period, setPeriod] = useState<'mes' | 'geral'>('mes');

  const { data: ranking } = useQuery({
    queryKey: ['ranking', period],
    queryFn: () =>
      api<RankingEntry[]>(
        `/gamification/ranking${period === 'geral' ? '' : '?period=mes'}`,
      ),
  });

  return (
    <section className="space-y-3 pt-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-zinc-400">
          Ranking
        </h2>
        <div className="flex gap-2">
          <Chip active={period === 'mes'} onClick={() => setPeriod('mes')}>
            Mês
          </Chip>
          <Chip active={period === 'geral'} onClick={() => setPeriod('geral')}>
            Geral
          </Chip>
        </div>
      </div>
      <div className="space-y-2">
        {ranking?.slice(0, 10).map((entry, i) => (
          <GlassCard
            key={entry.user?.id ?? i}
            className={`flex items-center gap-3 p-3 ${i < 3 ? 'border-gold-500/20' : ''}`}
          >
            <span className="w-7 text-center font-display font-bold text-zinc-500">
              {PODIUM[i] ?? entry.position}
            </span>
            <Avatar
              name={entry.user?.name ?? '?'}
              src={entry.user?.avatarUrl}
              size={34}
            />
            <p className="flex-1 truncate text-sm font-medium">
              {entry.user?.nickname || entry.user?.name}
            </p>
            <span className="font-display text-sm font-bold gold-text">
              {entry.xp.toLocaleString('pt-BR')} XP
            </span>
          </GlassCard>
        ))}
        {ranking?.length === 0 && (
          <p className="py-4 text-center text-sm text-zinc-500">
            Sem pontuação no período ainda.
          </p>
        )}
      </div>
    </section>
  );
}
