'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { api, patch, post } from '@/lib/api';
import { GlassCard, Spinner } from '@/components/ui';
import { useXpToast } from '@/components/xp-toast';

interface ManagedMission {
  id: string;
  title: string;
  description?: string;
  xpReward: number;
  frequency: 'DIARIA' | 'SEMANAL' | 'ESPECIAL';
  area: string;
  active: boolean;
  weeklyChallenge?: { id: string; title: string } | null;
}

const AREAS = [
  ['PALAVRA', '📖 Palavra'],
  ['ORACAO', '🙏 Oração'],
  ['SERVICO', '❤️ Serviço'],
  ['COMUNHAO', '🤝 Comunhão'],
  ['EVANGELISMO', '🌍 Evangelismo'],
  ['ADORACAO', '🎵 Adoração'],
] as const;

const AREA_EMOJI = Object.fromEntries(
  AREAS.map(([key, label]) => [key, label.split(' ')[0]]),
);

interface MissionForm {
  title: string;
  xpReward: number;
  frequency: 'DIARIA' | 'SEMANAL';
  area: string;
}

function MissionForm({
  initial,
  onSave,
  saving,
  onCancel,
  lockFrequency,
}: {
  initial: MissionForm;
  onSave: (form: MissionForm) => void;
  saving: boolean;
  onCancel: () => void;
  lockFrequency?: boolean;
}) {
  const [form, setForm] = useState(initial);
  const set = (p: Partial<MissionForm>) => setForm((f) => ({ ...f, ...p }));

  return (
    <div className="space-y-3">
      <input
        className="input"
        placeholder="Título da missão (ex.: Orar 15 minutos)"
        value={form.title}
        onChange={(e) => set({ title: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <select
          className="input"
          value={form.area}
          onChange={(e) => set({ area: e.target.value })}
          aria-label="Área"
        >
          {AREAS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {!lockFrequency && (
          <select
            className="input"
            value={form.frequency}
            onChange={(e) =>
              set({ frequency: e.target.value as 'DIARIA' | 'SEMANAL' })
            }
            aria-label="Frequência"
          >
            <option value="DIARIA">🔁 Diária</option>
            <option value="SEMANAL">📅 Semanal</option>
          </select>
        )}
        <div className="flex items-center gap-2">
          <input
            className="input"
            type="number"
            min={1}
            max={500}
            value={form.xpReward}
            onChange={(e) => set({ xpReward: Number(e.target.value) })}
            aria-label="XP"
          />
          <span className="text-sm text-gold-400">XP</span>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          className="btn-gold flex-1"
          disabled={!form.title || form.xpReward < 1 || saving}
          onClick={() => onSave(form)}
        >
          {saving ? 'Salvando...' : 'Salvar missão 🎯'}
        </button>
        <button className="btn-ghost" onClick={onCancel}>
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

export function AdminMissions() {
  const queryClient = useQueryClient();
  const { show } = useXpToast();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: missions, isLoading } = useQuery({
    queryKey: ['missions-manage'],
    queryFn: () => api<ManagedMission[]>('/missions/manage'),
  });

  const refresh = () => {
    setCreating(false);
    setEditingId(null);
    queryClient.invalidateQueries({ queryKey: ['missions-manage'] });
    queryClient.invalidateQueries({ queryKey: ['missions-daily'] });
    queryClient.invalidateQueries({ queryKey: ['weekly-challenge'] });
  };

  const create = useMutation({
    mutationFn: (form: MissionForm) => post('/missions', form),
    onSuccess: () => {
      show('Missão criada 🎯');
      refresh();
    },
    onError: (e) => show('Ops!', e instanceof Error ? e.message : 'Erro'),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MissionForm> & { active?: boolean } }) =>
      patch(`/missions/${id}`, data),
    onSuccess: () => {
      show('Missão atualizada ✏️');
      refresh();
    },
    onError: (e) => show('Ops!', e instanceof Error ? e.message : 'Erro'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/missions/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      show('Missão excluída 🗑️');
      refresh();
    },
    onError: (e) => show('Ops!', e instanceof Error ? e.message : 'Erro'),
  });

  const daily = missions?.filter((m) => m.frequency === 'DIARIA') ?? [];
  const weekly = missions?.filter((m) => m.frequency === 'SEMANAL') ?? [];

  const renderMission = (mission: ManagedMission) => (
    <GlassCard key={mission.id} className={`p-4 ${mission.active ? '' : 'opacity-50'}`}>
      {editingId === mission.id ? (
        <MissionForm
          initial={{
            title: mission.title,
            xpReward: mission.xpReward,
            frequency: mission.frequency as 'DIARIA' | 'SEMANAL',
            area: mission.area,
          }}
          saving={update.isPending}
          onSave={(form) => update.mutate({ id: mission.id, data: form })}
          onCancel={() => setEditingId(null)}
          lockFrequency
        />
      ) : (
        <div className="flex items-center gap-3">
          <span className="text-xl">{AREA_EMOJI[mission.area] ?? '⭐'}</span>
          <div className="flex-1">
            <p className={`font-medium ${mission.active ? '' : 'line-through'}`}>
              {mission.title}
            </p>
            <p className="text-xs text-zinc-500">
              +{mission.xpReward} XP
              {mission.weeklyChallenge ? ` · ${mission.weeklyChallenge.title}` : ''}
              {mission.active ? '' : ' · desativada'}
            </p>
          </div>
          <button
            className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:text-zinc-200"
            onClick={() =>
              update.mutate({ id: mission.id, data: { active: !mission.active } })
            }
          >
            {mission.active ? 'Desativar' : 'Ativar'}
          </button>
          <button
            className="rounded-xl border border-white/10 p-2 text-zinc-400 transition-colors hover:text-zinc-200"
            title="Editar"
            onClick={() => setEditingId(mission.id)}
          >
            <Pencil size={16} />
          </button>
          <button
            className="rounded-xl border border-white/10 p-2 text-zinc-500 transition-colors hover:border-red-500/30 hover:text-red-400"
            title="Excluir"
            onClick={() => {
              if (confirm(`Excluir a missão "${mission.title}"?`))
                remove.mutate(mission.id);
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </GlassCard>
  );

  return (
    <section className="space-y-3 pt-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-zinc-400">
          Missões
        </h2>
        <button className="btn-gold px-4 py-2" onClick={() => setCreating(!creating)}>
          <Plus size={18} />
          Nova missão
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
              <MissionForm
                initial={{ title: '', xpReward: 15, frequency: 'DIARIA', area: 'COMUNHAO' }}
                saving={create.isPending}
                onSave={(form) => create.mutate(form)}
                onCancel={() => setCreating(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <p className="pt-1 text-xs uppercase tracking-widest text-zinc-600">
            🔁 Diárias ({daily.length})
          </p>
          <div className="space-y-2">{daily.map(renderMission)}</div>
          {weekly.length > 0 && (
            <>
              <p className="pt-2 text-xs uppercase tracking-widest text-zinc-600">
                📅 Semanais ({weekly.length})
              </p>
              <div className="space-y-2">{weekly.map(renderMission)}</div>
            </>
          )}
        </>
      )}
    </section>
  );
}
