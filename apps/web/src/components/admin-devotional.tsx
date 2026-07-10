'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Plus, Trash2, X } from 'lucide-react';
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
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  // hoje + agendados, com opção de excluir (o banco de 365 dias
  // republica o dia excluído na próxima abertura do app)
  const upcoming =
    devotionals
      ?.filter((d) => d.date.slice(0, 10) >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date)) ?? [];

  const remove = useMutation({
    mutationFn: (id: string) => api(`/devotionals/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      show('Devocional excluído', 'O banco anual assume este dia');
      queryClient.invalidateQueries({ queryKey: ['devotionals'] });
      queryClient.invalidateQueries({ queryKey: ['devotional-today'] });
    },
    onError: (e) => show('Ops!', e instanceof Error ? e.message : 'Erro'),
  });

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
        <button className="btn-brand px-4 py-2" onClick={() => setOpen(!open)}>
          <Plus size={18} />
          Publicar
        </button>
      </div>

      <GlassCard className="border-brand-500/10 p-4">
        <p className="text-sm text-zinc-400">
          <BookOpen size={14} className="mr-1.5 inline text-brand-400" />
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
                  className="btn-brand flex-1"
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

      {upcoming.length > 0 && (
        <div className="space-y-2">
          {upcoming.map((d, i) => (
            <GlassCard key={d.id} className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="font-medium">{d.theme}</p>
                  <p className="text-xs text-zinc-500">{d.verseRef}</p>
                </div>
                <span className="rounded-full bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-300">
                  {d.date.slice(0, 10) === todayStr
                    ? 'hoje'
                    : new Date(d.date).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        timeZone: 'UTC',
                      })}
                </span>
                <button
                  className="rounded-xl border border-white/10 p-2 text-zinc-500 transition-colors hover:border-red-500/30 hover:text-red-400"
                  title="Excluir devocional (o banco anual assume)"
                  onClick={() => {
                    if (
                      confirm(
                        `Excluir "${d.theme}"? O banco de 365 dias publicará o conteúdo do dia no lugar. Quem já concluiu este devocional perderá a marcação.`,
                      )
                    )
                      remove.mutate(d.id);
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </section>
  );
}
