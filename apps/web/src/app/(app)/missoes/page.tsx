'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { api, post } from '@/lib/api';
import type { Mission, WeeklyChallenge, XpGrant } from '@/lib/types';
import { EmptyState, GlassCard, Spinner, XpBar } from '@/components/ui';
import { useXpToast } from '@/components/xp-toast';
import { celebrate } from '@/components/celebrate';

const AREA_EMOJI: Record<string, string> = {
  PALAVRA: '📖',
  ORACAO: '🙏',
  SERVICO: '❤️',
  COMUNHAO: '🤝',
  EVANGELISMO: '🌍',
  ADORACAO: '🎵',
};

function MissionRow({
  mission,
  onComplete,
  pending,
  delay,
}: {
  mission: Mission;
  onComplete: (id: string) => void;
  pending: boolean;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.35 }}
      className={`glass flex items-center gap-4 p-4 transition-opacity ${
        mission.completed ? 'opacity-60' : 'glass-hover'
      }`}
    >
      <span className="text-2xl">{AREA_EMOJI[mission.area] ?? '⭐'}</span>
      <div className="flex-1">
        <p
          className={`font-medium ${mission.completed ? 'line-through text-zinc-500' : ''}`}
        >
          {mission.title}
        </p>
        <p className="text-xs text-gold-400">+{mission.xpReward} XP</p>
      </div>
      {mission.completed ? (
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
          <Check size={18} />
        </span>
      ) : (
        <button
          onClick={() => onComplete(mission.id)}
          disabled={pending}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gold-500/30 text-gold-400 transition-all hover:bg-gold-500/10 active:scale-90 disabled:opacity-40"
          aria-label={`Concluir: ${mission.title}`}
        >
          <Check size={18} />
        </button>
      )}
    </motion.div>
  );
}

export default function MissoesPage() {
  const queryClient = useQueryClient();
  const { showXp, show } = useXpToast();

  const { data: missions, isLoading } = useQuery({
    queryKey: ['missions-daily'],
    queryFn: () => api<Mission[]>('/missions/daily'),
  });
  const { data: challenge } = useQuery({
    queryKey: ['weekly-challenge'],
    queryFn: () => api<WeeklyChallenge | null>('/missions/weekly-challenge'),
  });

  const complete = useMutation({
    mutationFn: (id: string) =>
      post<{ xp: XpGrant; allDailyDone: boolean }>(`/missions/${id}/complete`),
    onSuccess: (data) => {
      showXp(data.xp);
      if (data.allDailyDone) {
        celebrate(true);
        show('Todas as missões do dia! 🎁', 'Caixa de bênçãos desbloqueada');
      }
      queryClient.invalidateQueries({ queryKey: ['missions-daily'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-challenge'] });
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
    },
  });

  if (isLoading) return <Spinner />;

  const done = missions?.filter((m) => m.completed).length ?? 0;

  return (
    <div className="space-y-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-zinc-500">
          Missões
        </p>
        <h1 className="font-display text-2xl font-bold">
          Pequenos passos, <span className="gold-text">grande jornada</span> 🎯
        </h1>
      </header>

      {missions && missions.length > 0 ? (
        <>
          <GlassCard>
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-400">Progresso de hoje</p>
              <p className="font-display font-bold gold-text">
                {done}/{missions.length}
              </p>
            </div>
            <div className="mt-2">
              <XpBar progress={missions.length ? done / missions.length : 0} />
            </div>
          </GlassCard>

          <div className="space-y-2">
            {missions.map((m, i) => (
              <MissionRow
                key={m.id}
                mission={m}
                onComplete={(id) => complete.mutate(id)}
                pending={complete.isPending}
                delay={i * 0.06}
              />
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          emoji="🕊️"
          title="Nenhuma missão hoje"
          subtitle="Aproveite o descanso — amanhã tem mais."
        />
      )}

      {challenge && (
        <section className="pt-4">
          <GlassCard className="border-gold-500/20">
            <p className="text-xs uppercase tracking-widest text-gold-400">
              Desafio da semana
            </p>
            <h2 className="mt-1 font-display text-lg font-bold">
              {challenge.title}
            </h2>
            {challenge.theme && (
              <p className="text-sm italic text-zinc-400">{challenge.theme}</p>
            )}
            <div className="mt-3">
              <XpBar progress={challenge.progress} label="Progresso do desafio" />
            </div>
          </GlassCard>
          <div className="mt-2 space-y-2">
            {challenge.missions.map((m, i) => (
              <MissionRow
                key={m.id}
                mission={m}
                onComplete={(id) => complete.mutate(id)}
                pending={complete.isPending}
                delay={i * 0.06}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
