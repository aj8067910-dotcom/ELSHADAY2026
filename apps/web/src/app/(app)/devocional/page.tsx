'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api, post } from '@/lib/api';
import type { Devotional, XpGrant } from '@/lib/types';
import { EmptyState, GlassCard, Spinner } from '@/components/ui';
import { useXpToast } from '@/components/xp-toast';

export default function DevocionalPage() {
  const queryClient = useQueryClient();
  const { showXp } = useXpToast();
  const [note, setNote] = useState('');

  const { data: devotional, isLoading } = useQuery({
    queryKey: ['devotional-today'],
    queryFn: () => api<Devotional | null>('/devotionals/today'),
  });
  const { data: history } = useQuery({
    queryKey: ['devotionals'],
    queryFn: () => api<Devotional[]>('/devotionals'),
  });

  const complete = useMutation({
    mutationFn: () =>
      post<{ xp: XpGrant; streak: { current: number } }>(
        `/devotionals/${devotional!.id}/complete`,
        { note: note || undefined },
      ),
    onSuccess: (data) => {
      showXp(data.xp);
      queryClient.invalidateQueries({ queryKey: ['devotional-today'] });
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
    },
  });

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-zinc-500">
          Devocional
        </p>
        <h1 className="font-display text-2xl font-bold">
          Palavra de <span className="gold-text">hoje</span> 📖
        </h1>
      </header>

      {devotional ? (
        <GlassCard>
          {devotional.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={devotional.imageUrl}
              alt=""
              className="mb-4 max-h-64 w-full rounded-2xl object-cover"
            />
          )}
          <h2 className="font-display text-xl font-bold">{devotional.theme}</h2>
          <blockquote className="my-4 rounded-2xl border-l-2 border-gold-500 bg-gold-500/[0.05] p-4 italic text-zinc-300">
            “{devotional.verse}”
            <footer className="mt-2 text-sm font-semibold not-italic text-gold-300">
              {devotional.verseRef}
            </footer>
          </blockquote>
          <p className="whitespace-pre-line leading-relaxed text-zinc-300">
            {devotional.body}
          </p>
          {devotional.question && (
            <div className="mt-4 rounded-2xl bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-widest text-zinc-500">
                Para refletir
              </p>
              <p className="mt-1 text-zinc-200">{devotional.question}</p>
            </div>
          )}

          <div className="mt-6">
            {devotional.completedByMe ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="rounded-2xl bg-emerald-500/10 p-4 text-center font-medium text-emerald-400"
              >
                ✓ Devocional concluído hoje. Sua constância agrada a Deus. 🙌
              </motion.div>
            ) : (
              <div className="space-y-3">
                <textarea
                  className="input min-h-24 resize-y"
                  placeholder="Anote o que Deus falou com você hoje... (opcional)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <button
                  className="btn-gold w-full"
                  onClick={() => complete.mutate()}
                  disabled={complete.isPending}
                >
                  {complete.isPending
                    ? 'Registrando...'
                    : 'Hoje fiz meu devocional ✨ (+20 XP)'}
                </button>
              </div>
            )}
          </div>
        </GlassCard>
      ) : (
        <EmptyState
          emoji="🌅"
          title="O devocional de hoje ainda não foi publicado"
          subtitle="Seu líder publicará em breve. Aproveite para orar!"
        />
      )}

      {history && history.length > 1 && (
        <section>
          <h2 className="mb-3 mt-8 font-display text-sm font-semibold uppercase tracking-widest text-zinc-400">
            Dias anteriores
          </h2>
          <div className="space-y-2">
            {history.slice(1, 8).map((d, i) => (
              <GlassCard key={d.id} delay={i * 0.05} className="glass-hover p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{d.theme}</p>
                    <p className="text-xs text-zinc-500">
                      {new Date(d.date).toLocaleDateString('pt-BR')} ·{' '}
                      {d.verseRef}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-500">
                    {d._count?.completions ?? 0} 🙌
                  </span>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
