'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartHandshake, Plus } from 'lucide-react';
import { api, post } from '@/lib/api';
import type { PrayerRequest } from '@/lib/types';
import { Avatar, EmptyState, GlassCard, Spinner } from '@/components/ui';
import { useXpToast } from '@/components/xp-toast';

export default function OracaoPage() {
  const queryClient = useQueryClient();
  const { show } = useXpToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [visibility, setVisibility] = useState<'PUBLICO' | 'LIDERANCA' | 'PRIVADO'>('PUBLICO');
  const [prayed, setPrayed] = useState<Record<string, number>>({});

  const { data: requests, isLoading } = useQuery({
    queryKey: ['prayer-requests'],
    queryFn: () => api<PrayerRequest[]>('/prayer/requests'),
  });

  const create = useMutation({
    mutationFn: () => post('/prayer/requests', { title, body, visibility }),
    onSuccess: () => {
      setOpen(false);
      setTitle('');
      setBody('');
      show('Pedido enviado 🙏', 'A família está orando com você');
      queryClient.invalidateQueries({ queryKey: ['prayer-requests'] });
    },
  });

  const intercede = useMutation({
    mutationFn: (id: string) =>
      post<{ count: number }>(`/prayer/requests/${id}/intercede`),
    onSuccess: (data, id) => {
      setPrayed((p) => ({ ...p, [id]: data.count }));
      show('Já orei 🙏');
    },
  });

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-500">
            Oração
          </p>
          <h1 className="font-display text-2xl font-bold">
            Orai uns <span className="brand-text">pelos outros</span> 🙏
          </h1>
        </div>
        <button className="btn-brand px-4 py-2" onClick={() => setOpen(!open)}>
          <Plus size={18} />
          Pedido
        </button>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass space-y-3 p-5">
              <input
                className="input"
                placeholder="Título do pedido"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <textarea
                className="input min-h-24"
                placeholder="Compartilhe seu pedido..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
              <div className="flex gap-2 text-xs">
                {(
                  [
                    ['PUBLICO', '🌍 Todos'],
                    ['LIDERANCA', '🛡️ Só liderança'],
                    ['PRIVADO', '🔒 Privado'],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setVisibility(value)}
                    className={`rounded-full px-3 py-1.5 transition-colors ${
                      visibility === value
                        ? 'bg-brand-gradient font-semibold text-ink-950'
                        : 'border border-white/10 text-zinc-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                className="btn-brand w-full"
                disabled={!title || !body || create.isPending}
                onClick={() => create.mutate()}
              >
                Enviar pedido 🙏 (+15 XP)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {requests && requests.length > 0 ? (
        <div className="space-y-2">
          {requests.map((r, i) => (
            <GlassCard key={r.id} delay={i * 0.04} className="p-4">
              <div className="flex items-start gap-3">
                <Avatar name={r.user.name} src={r.user.avatarUrl} size={38} />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">
                      {r.user.nickname || r.user.name}
                    </p>
                    {r.live && (
                      <span className="animate-pulse rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-400">
                        ● AO VIVO
                      </span>
                    )}
                    {r.answered && (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                        ✓ RESPONDIDO
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 font-medium">{r.title}</p>
                  <p className="text-sm text-zinc-400">{r.body}</p>
                  {r.testimony && (
                    <p className="mt-2 rounded-xl bg-emerald-500/[0.06] p-3 text-sm text-emerald-300">
                      💬 {r.testimony}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-white/[0.05] pt-3">
                <span className="text-xs text-zinc-500">
                  {(prayed[r.id] ?? r._count.intercessions)}{' '}
                  {(prayed[r.id] ?? r._count.intercessions) === 1
                    ? 'pessoa orou'
                    : 'pessoas oraram'}
                </span>
                <button
                  onClick={() => intercede.mutate(r.id)}
                  disabled={intercede.isPending}
                  className="flex items-center gap-2 rounded-full border border-brand-500/30 px-4 py-1.5 text-sm font-medium text-brand-300 transition-all hover:bg-brand-500/10 active:scale-95"
                >
                  <HeartHandshake size={16} />
                  Orar agora
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <EmptyState
          emoji="🕊️"
          title="Nenhum pedido por enquanto"
          subtitle="Seja o primeiro a compartilhar."
        />
      )}
    </div>
  );
}
