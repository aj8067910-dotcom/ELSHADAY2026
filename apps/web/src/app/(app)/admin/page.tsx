'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import QRCode from 'react-qr-code';
import { Pencil, Plus, QrCode, Trash2, X } from 'lucide-react';
import { api, patch, post } from '@/lib/api';
import type { ChurchEvent, Me } from '@/lib/types';
import { LEADERSHIP_ROLES } from '@/lib/types';
import { EmptyState, GlassCard, Spinner } from '@/components/ui';
import { useXpToast } from '@/components/xp-toast';
import { AdminMembers } from '@/components/admin-members';
import { AdminDevotional } from '@/components/admin-devotional';
import { AdminMissions } from '@/components/admin-missions';
import { AdminAlerts } from '@/components/admin-alerts';
import { AdminRanking } from '@/components/admin-ranking';

const EVENT_TYPES = [
  ['CULTO', '⛪ Culto'],
  ['RETIRO', '⛺ Retiro'],
  ['CONGRESSO', '🎤 Congresso'],
  ['ACAMPAMENTO', '🏕️ Acampamento'],
  ['LAZER', '🎉 Lazer'],
  ['EVANGELISMO', '🌍 Evangelismo'],
  ['TREINAMENTO', '📚 Treinamento'],
  ['REUNIAO', '🤝 Reunião'],
] as const;

interface EventForm {
  type: string;
  title: string;
  description: string;
  startsAt: string;
  location: string;
  xpReward: number;
  repeatWeeklyCount: number;
}

const EMPTY_FORM: EventForm = {
  type: 'CULTO',
  title: '',
  description: '',
  startsAt: '',
  location: '',
  xpReward: 50,
  repeatWeeklyCount: 0,
};

const REPEAT_OPTIONS = [
  [0, 'Não repetir'],
  [3, 'Por 1 mês (4 ocorrências)'],
  [7, 'Por 2 meses (8 ocorrências)'],
  [11, 'Por 3 meses (12 ocorrências)'],
  [25, 'Por 6 meses (26 ocorrências)'],
  [51, 'Por 1 ano (52 ocorrências)'],
] as const;

interface Dashboard {
  totalUsers: number;
  activeUsersWeek: number;
  devotionalsWeek: number;
  checkinsWeek: number;
  xpWeek: number;
  upcomingEvents: number;
}

function EventEditor({
  initial,
  onSave,
  saving,
  onCancel,
  showRepeat,
}: {
  initial: EventForm;
  onSave: (form: EventForm) => void;
  saving: boolean;
  onCancel?: () => void;
  showRepeat?: boolean;
}) {
  const [form, setForm] = useState<EventForm>(initial);
  const set = (patch: Partial<EventForm>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 text-xs">
        {EVENT_TYPES.map(([value, label]) => (
          <button
            key={value}
            onClick={() => set({ type: value })}
            className={`rounded-full px-3 py-1.5 transition-colors ${
              form.type === value
                ? 'bg-brand-gradient font-semibold text-ink-950'
                : 'border border-white/10 text-zinc-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <input
        className="input"
        placeholder="Título do evento"
        value={form.title}
        onChange={(e) => set({ title: e.target.value })}
      />
      <textarea
        className="input min-h-20"
        placeholder="Descrição (opcional)"
        value={form.description}
        onChange={(e) => set({ description: e.target.value })}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          className="input"
          type="datetime-local"
          aria-label="Data e hora"
          value={form.startsAt}
          onChange={(e) => set({ startsAt: e.target.value })}
        />
        <input
          className="input"
          placeholder="Local"
          value={form.location}
          onChange={(e) => set({ location: e.target.value })}
        />
      </div>
      <div className="flex items-center gap-3">
        <label className="text-sm text-zinc-400">Recompensa:</label>
        <input
          className="input w-28"
          type="number"
          min={0}
          value={form.xpReward}
          onChange={(e) => set({ xpReward: Number(e.target.value) })}
        />
        <span className="text-sm text-brand-400">XP</span>
      </div>
      {showRepeat && (
        <div>
          <label className="mb-1 block text-xs text-zinc-500">
            🔁 Recorrência semanal (mesmo dia e horário — ex.: toda terça)
          </label>
          <select
            className="input"
            value={form.repeatWeeklyCount}
            onChange={(e) => set({ repeatWeeklyCount: Number(e.target.value) })}
          >
            {REPEAT_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="flex gap-2">
        <button
          className="btn-brand flex-1"
          disabled={!form.title || !form.startsAt || saving}
          onClick={() => onSave(form)}
        >
          {saving ? 'Salvando...' : 'Salvar evento ✨'}
        </button>
        {onCancel && (
          <button className="btn-ghost" onClick={onCancel}>
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const queryClient = useQueryClient();
  const { show } = useXpToast();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [qrEvent, setQrEvent] = useState<ChurchEvent | null>(null);

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<Me>('/users/me'),
  });
  const isLeadership = me && LEADERSHIP_ROLES.includes(me.role);

  const { data: stats } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api<Dashboard>('/admin/dashboard'),
    enabled: !!isLeadership,
  });
  const { data: events, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => api<ChurchEvent[]>('/events'),
    enabled: !!isLeadership,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['events'] });
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
  };

  const create = useMutation({
    mutationFn: (form: EventForm) =>
      post<{ created: number }>('/events', {
        ...form,
        description: form.description || undefined,
        location: form.location || undefined,
        startsAt: new Date(form.startsAt).toISOString(),
      }),
    onSuccess: (data) => {
      setCreating(false);
      show(
        data.created > 1
          ? `${data.created} eventos criados! 🔁`
          : 'Evento criado! 🎪',
        data.created > 1 ? 'Recorrência semanal gerada' : undefined,
      );
      invalidate();
    },
    onError: (e) => show('Ops!', e instanceof Error ? e.message : 'Erro'),
  });

  const update = useMutation({
    mutationFn: ({ id, form }: { id: string; form: EventForm }) =>
      patch(`/events/${id}`, {
        ...form,
        description: form.description || undefined,
        location: form.location || undefined,
        startsAt: new Date(form.startsAt).toISOString(),
      }),
    onSuccess: () => {
      setEditingId(null);
      show('Evento atualizado ✏️');
      invalidate();
    },
    onError: (e) => show('Ops!', e instanceof Error ? e.message : 'Erro'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/events/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      show('Evento excluído 🗑️');
      invalidate();
    },
    onError: (e) => show('Ops!', e instanceof Error ? e.message : 'Erro'),
  });

  const showQr = async (id: string) => {
    const detail = await api<ChurchEvent>(`/events/${id}`);
    setQrEvent(detail);
  };

  if (!me) return <Spinner />;
  if (!isLeadership) {
    return (
      <EmptyState
        emoji="🛡️"
        title="Área da liderança"
        subtitle="Este painel é visível apenas para líderes, pastores e administradores."
      />
    );
  }

  const toForm = (e: ChurchEvent): EventForm => ({
    type: e.type,
    title: e.title,
    description: e.description ?? '',
    // datetime-local espera horário local sem timezone
    startsAt: new Date(
      new Date(e.startsAt).getTime() -
        new Date().getTimezoneOffset() * 60_000,
    )
      .toISOString()
      .slice(0, 16),
    location: e.location ?? '',
    xpReward: e.xpReward,
    repeatWeeklyCount: 0,
  });

  return (
    <div className="space-y-4">
      <header>
        <p className="text-xs uppercase tracking-widest text-zinc-500">
          Painel da liderança
        </p>
        <h1 className="font-display text-2xl font-bold">
          Administração <span className="brand-text">🛡️</span>
        </h1>
      </header>

      {stats && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {(
            [
              ['👥', stats.totalUsers, 'membros'],
              ['⚡', stats.activeUsersWeek, 'ativos na semana'],
              ['📖', stats.devotionalsWeek, 'devocionais/semana'],
              ['🎟️', stats.checkinsWeek, 'check-ins/semana'],
              ['✨', stats.xpWeek, 'XP na semana'],
              ['📅', stats.upcomingEvents, 'eventos futuros'],
            ] as const
          ).map(([emoji, value, label], i) => (
            <GlassCard key={label} delay={i * 0.04} className="p-4">
              <p className="font-display text-xl font-bold">
                {emoji} {Number(value).toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-zinc-500">{label}</p>
            </GlassCard>
          ))}
        </div>
      )}

      {/* criação de evento */}
      <div className="flex items-center justify-between pt-2">
        <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-zinc-400">
          Eventos
        </h2>
        <button className="btn-brand px-4 py-2" onClick={() => setCreating(!creating)}>
          <Plus size={18} />
          Novo evento
        </button>
      </div>

      <AnimatePresence>
        {creating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass p-5">
              <EventEditor
                initial={EMPTY_FORM}
                saving={create.isPending}
                onSave={(form) => create.mutate(form)}
                onCancel={() => setCreating(false)}
                showRepeat
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* modal do QR Code */}
      <AnimatePresence>
        {qrEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={() => setQrEvent(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass w-full max-w-sm p-6 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-display text-lg font-bold">{qrEvent.title}</h3>
              <p className="mb-4 text-sm text-zinc-400">
                QR Code de check-in · +{qrEvent.xpReward} XP
              </p>
              {qrEvent.checkinCode ? (
                <>
                  <div className="mx-auto w-fit rounded-2xl bg-white p-4">
                    <QRCode value={qrEvent.checkinCode} size={200} />
                  </div>
                  <p className="mt-3 break-all rounded-xl bg-white/[0.04] p-2 font-mono text-xs text-zinc-400">
                    {qrEvent.checkinCode}
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">
                    Projete este QR no evento. Os membros escaneiam (ou digitam
                    o código) na aba Eventos → Check-in.
                  </p>
                </>
              ) : (
                <p className="text-sm text-red-400">
                  Sem permissão para ver o código deste evento.
                </p>
              )}
              <button className="btn-ghost mt-4 w-full" onClick={() => setQrEvent(null)}>
                Fechar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* lista de eventos */}
      {isLoading ? (
        <Spinner />
      ) : events && events.length > 0 ? (
        <div className="space-y-2">
          {events.map((event) => (
            <GlassCard key={event.id} className="p-4">
              {editingId === event.id ? (
                <EventEditor
                  initial={toForm(event)}
                  saving={update.isPending}
                  onSave={(form) => update.mutate({ id: event.id, form })}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-medium">
                      {EVENT_TYPES.find(([v]) => v === event.type)?.[1] ?? event.type}{' '}
                      · {event.title}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {new Date(event.startsAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {event.location ? ` · ${event.location}` : ''} · +
                      {event.xpReward} XP · {event._count.attendances} inscritos
                    </p>
                  </div>
                  <button
                    className="rounded-xl border border-brand-500/30 p-2 text-brand-300 transition-colors hover:bg-brand-500/10"
                    title="QR Code de check-in"
                    onClick={() => showQr(event.id)}
                  >
                    <QrCode size={18} />
                  </button>
                  <button
                    className="rounded-xl border border-white/10 p-2 text-zinc-400 transition-colors hover:text-zinc-200"
                    title="Editar"
                    onClick={() => setEditingId(event.id)}
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    className="rounded-xl border border-white/10 p-2 text-zinc-500 transition-colors hover:border-red-500/30 hover:text-red-400"
                    title="Excluir"
                    onClick={() => {
                      if (confirm(`Excluir "${event.title}"?`)) remove.mutate(event.id);
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      ) : (
        <EmptyState emoji="📅" title="Nenhum evento criado ainda" />
      )}

      <AdminAlerts />

      <AdminDevotional />

      <AdminMissions />

      <AdminRanking />

      <AdminMembers me={me} />
    </div>
  );
}
