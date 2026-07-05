'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Plus, X } from 'lucide-react';
import { api, post } from '@/lib/api';
import type { Devotional } from '@/lib/types';
import { GlassCard } from '@/components/ui';
import { useXpToast } from '@/components/xp-toast';

function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function AdminDevotional() {
  const queryClient = useQueryClient();
  const { show } = useXpToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    date: tomorrowStr(),
    theme: '',
    verseRef: '',
    verse: '',
    body: '',
    question: '',
  });
  const set = (patch: Partial<typeof form>) =>
    setForm((f) => ({ ...f, ...patch }));

  const { data: devotionals } = useQuery({
    queryKey: ['devotionals'],
    queryFn: () => api<Devotional[]>('/devotionals'),
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const scheduled = devotionals?.filter((d) => new Date(d.date) > today) ?? [];

  const publish = useMutation({
    mutationFn: () =>
      post('/devotionals', {
        ...form,
        question: form.question || undefined,
      }),
    onSuccess: () => {
      setOpen(false);
      setForm({
        date: tomorrowStr(),
        theme: '',
        verseRef: '',
        verse: '',
        body: '',
        question: '',
      });
      show('Devocional agendado 📖', 'Aparecerá para todos na data escolhida');
      queryClient.invalidateQueries({ queryKey: ['devotionals'] });
    },
    onError: (e) => show('Ops!', e instanceof Error ? e.message : 'Erro'),
  });

  const valid = form.date && form.theme && form.verseRef && form.verse && form.body;

  return (
    <section className="space-y-3 pt-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-zinc-400">
          Devocional
        </h2>
        <button className="btn-gold px-4 py-2" onClick={() => setOpen(!open)}>
          <Plus size={18} />
          Publicar
        </button>
      </div>

      <GlassCard className="border-gold-500/10 p-4">
        <p className="text-sm text-zinc-400">
          <BookOpen size={14} className="mr-1.5 inline text-gold-400" />
          O devocional de cada dia é publicado <b>automaticamente</b> pelo
          banco de 365 dias (jornada bíblica anual). Se quiser um conteúdo
          seu, publique <b>até o dia anterior</b> — o que você publicar tem
          prioridade sobre o automático.
        </p>
      </GlassCard>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass space-y-3 p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">
                    Data (a partir de amanhã)
                  </label>
                  <input
                    className="input"
                    type="date"
                    min={tomorrowStr()}
                    value={form.date}
                    onChange={(e) => set({ date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-zinc-500">
                    Referência bíblica
                  </label>
                  <input
                    className="input"
                    placeholder="Ex.: Mateus 7:24"
                    value={form.verseRef}
                    onChange={(e) => set({ verseRef: e.target.value })}
                  />
                </div>
              </div>
              <input
                className="input"
                placeholder="Tema do devocional"
                value={form.theme}
                onChange={(e) => set({ theme: e.target.value })}
              />
              <textarea
                className="input min-h-20"
                placeholder="Versículo (texto)"
                value={form.verse}
                onChange={(e) => set({ verse: e.target.value })}
              />
              <textarea
                className="input min-h-28"
                placeholder="Texto do devocional"
                value={form.body}
                onChange={(e) => set({ body: e.target.value })}
              />
              <input
                className="input"
                placeholder="Pergunta para reflexão (opcional)"
                value={form.question}
                onChange={(e) => set({ question: e.target.value })}
              />
              <div className="flex gap-2">
                <button
                  className="btn-gold flex-1"
                  disabled={!valid || publish.isPending}
                  onClick={() => publish.mutate()}
                >
                  {publish.isPending ? 'Publicando...' : 'Agendar devocional 📖'}
                </button>
                <button className="btn-ghost" onClick={() => setOpen(false)}>
                  <X size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {scheduled.length > 0 && (
        <div className="space-y-2">
          {scheduled
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((d) => (
              <GlassCard key={d.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{d.theme}</p>
                    <p className="text-xs text-zinc-500">{d.verseRef}</p>
                  </div>
                  <span className="rounded-full bg-gold-500/10 px-3 py-1 text-xs font-medium text-gold-300">
                    {new Date(d.date).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      timeZone: 'UTC',
                    })}
                  </span>
                </div>
              </GlassCard>
            ))}
        </div>
      )}
    </section>
  );
}
