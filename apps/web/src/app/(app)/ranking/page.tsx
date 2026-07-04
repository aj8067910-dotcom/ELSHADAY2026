'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { RankingEntry } from '@/lib/types';
import { Avatar, Chip, EmptyState, GlassCard, Spinner } from '@/components/ui';

const PODIUM = ['🥇', '🥈', '🥉'];

export default function RankingPage() {
  const [period, setPeriod] = useState<'geral' | 'mes' | 'ano'>('mes');

  const { data: ranking, isLoading } = useQuery({
    queryKey: ['ranking', period],
    queryFn: () =>
      api<RankingEntry[]>(
        `/gamification/ranking${period === 'geral' ? '' : `?period=${period}`}`,
      ),
  });

  return (
    <div className="space-y-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-zinc-500">
          Jornada coletiva
        </p>
        <h1 className="font-display text-2xl font-bold">
          Crescendo <span className="gold-text">juntos</span> 🌱
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Isto não é competição — é uma celebração da constância de cada um.
        </p>
      </header>

      <div className="flex gap-2">
        <Chip active={period === 'mes'} onClick={() => setPeriod('mes')}>
          Este mês
        </Chip>
        <Chip active={period === 'ano'} onClick={() => setPeriod('ano')}>
          Este ano
        </Chip>
        <Chip active={period === 'geral'} onClick={() => setPeriod('geral')}>
          Geral
        </Chip>
      </div>

      {isLoading ? (
        <Spinner />
      ) : ranking && ranking.length > 0 ? (
        <div className="space-y-2">
          {ranking.map((entry, i) => (
            <GlassCard
              key={entry.user?.id ?? i}
              delay={i * 0.04}
              className={`flex items-center gap-4 p-4 ${
                i < 3 ? 'border-gold-500/20' : ''
              }`}
            >
              <span className="w-8 text-center font-display text-lg font-bold text-zinc-500">
                {PODIUM[i] ?? entry.position}
              </span>
              <Avatar
                name={entry.user?.name ?? '?'}
                src={entry.user?.avatarUrl}
                size={40}
              />
              <div className="flex-1">
                <p className="font-medium">
                  {entry.user?.nickname || entry.user?.name}
                </p>
                {entry.level && (
                  <p className="text-xs text-zinc-500">
                    Nível {entry.level.level} · {entry.level.title}
                  </p>
                )}
              </div>
              <span className="font-display font-bold gold-text">
                {entry.xp.toLocaleString('pt-BR')} XP
              </span>
            </GlassCard>
          ))}
        </div>
      ) : (
        <EmptyState
          emoji="🌱"
          title="A jornada está só começando"
          subtitle="Complete missões e devocionais para aparecer aqui."
        />
      )}

      <p className="pt-2 text-center text-xs text-zinc-600">
        “Assim brilhe a vossa luz…” — cada ponto aqui é serviço, oração e
        comunhão. Continue no seu ritmo. 💛
      </p>
    </div>
  );
}
