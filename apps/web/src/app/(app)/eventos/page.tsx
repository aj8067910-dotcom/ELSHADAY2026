'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, MapPin, QrCode, Users } from 'lucide-react';
import { api, post } from '@/lib/api';
import type { ChurchEvent, XpGrant } from '@/lib/types';
import { EmptyState, GlassCard, Spinner } from '@/components/ui';
import { useXpToast } from '@/components/xp-toast';

const TYPE_META: Record<string, { emoji: string; label: string }> = {
  CULTO: { emoji: '⛪', label: 'Culto' },
  RETIRO: { emoji: '⛺', label: 'Retiro' },
  CONGRESSO: { emoji: '🎤', label: 'Congresso' },
  ACAMPAMENTO: { emoji: '🏕️', label: 'Acampamento' },
  LAZER: { emoji: '🎉', label: 'Lazer' },
  EVANGELISMO: { emoji: '🌍', label: 'Evangelismo' },
  TREINAMENTO: { emoji: '📚', label: 'Treinamento' },
  REUNIAO: { emoji: '🤝', label: 'Reunião' },
};

export default function EventosPage() {
  const queryClient = useQueryClient();
  const { showXp, show } = useXpToast();
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [code, setCode] = useState('');

  const { data: events, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => api<ChurchEvent[]>('/events'),
  });

  const confirm = useMutation({
    mutationFn: (id: string) => post(`/events/${id}/confirm`),
    onSuccess: () => {
      show('Presença confirmada! 🎉', 'Te esperamos lá');
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const checkin = useMutation({
    mutationFn: () => post<{ xp: XpGrant }>('/events/checkin', { code }),
    onSuccess: (data) => {
      showXp(data.xp);
      setCheckinOpen(false);
      setCode('');
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
    },
    onError: (e) => show('Ops!', e instanceof Error ? e.message : 'QR inválido'),
  });

  if (isLoading) return <Spinner />;

  const upcoming = events?.filter((e) => new Date(e.startsAt) >= new Date());
  const past = events?.filter((e) => new Date(e.startsAt) < new Date());

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-500">
            Eventos
          </p>
          <h1 className="font-display text-2xl font-bold">
            Melhor <span className="brand-text">juntos</span> 🎪
          </h1>
        </div>
        <button
          className="btn-ghost px-4 py-2"
          onClick={() => setCheckinOpen(!checkinOpen)}
        >
          <QrCode size={18} />
          Check-in
        </button>
      </header>

      <AnimatePresence>
        {checkinOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass space-y-3 p-5">
              <p className="text-sm text-zinc-400">
                Escaneie o QR Code do evento e cole o código aqui:
              </p>
              <input
                className="input"
                placeholder="Código do check-in"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <button
                className="btn-brand w-full"
                disabled={!code || checkin.isPending}
                onClick={() => checkin.mutate()}
              >
                Fazer check-in ✨
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {upcoming && upcoming.length > 0 ? (
        <div className="space-y-3">
          {upcoming.map((event, i) => {
            const meta = TYPE_META[event.type] ?? { emoji: '📅', label: event.type };
            const date = new Date(event.startsAt);
            return (
              <GlassCard key={event.id} delay={i * 0.05} className="glass-hover">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 flex-col items-center justify-center rounded-2xl bg-brand-500/10">
                    <span className="font-display text-lg font-bold text-brand-300">
                      {date.getDate()}
                    </span>
                    <span className="text-[10px] uppercase text-zinc-500">
                      {date.toLocaleDateString('pt-BR', { month: 'short' })}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-zinc-500">
                      {meta.emoji} {meta.label} · +{event.xpReward} XP
                    </p>
                    <h2 className="font-display font-semibold">{event.title}</h2>
                    {event.description && (
                      <p className="mt-0.5 text-sm text-zinc-400">
                        {event.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <CalendarDays size={13} />
                        {date.toLocaleDateString('pt-BR', {
                          weekday: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={13} />
                          {event.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users size={13} />
                        {event._count.attendances} confirmados
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  {event.myStatus === 'CHECKIN' ? (
                    <span className="block rounded-2xl bg-emerald-500/10 py-2.5 text-center text-sm font-medium text-emerald-400">
                      ✓ Você esteve lá
                    </span>
                  ) : event.myStatus === 'CONFIRMADO' ? (
                    <span className="block rounded-2xl border border-brand-500/20 bg-brand-500/[0.06] py-2.5 text-center text-sm font-medium text-brand-300">
                      🎟️ Presença confirmada
                    </span>
                  ) : (
                    <button
                      className="btn-ghost w-full py-2.5"
                      onClick={() => confirm.mutate(event.id)}
                      disabled={confirm.isPending}
                    >
                      Eu vou! 🙋
                    </button>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      ) : (
        <EmptyState
          emoji="📅"
          title="Nenhum evento agendado"
          subtitle="Fique de olho — novidades em breve."
        />
      )}

      {past && past.length > 0 && (
        <section>
          <h2 className="mb-2 mt-8 font-display text-sm font-semibold uppercase tracking-widest text-zinc-400">
            Já aconteceu
          </h2>
          <div className="space-y-2 opacity-60">
            {past.slice(0, 5).map((event) => (
              <div key={event.id} className="glass p-4 text-sm">
                {TYPE_META[event.type]?.emoji} {event.title} ·{' '}
                {new Date(event.startsAt).toLocaleDateString('pt-BR')}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
