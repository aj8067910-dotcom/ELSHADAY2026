'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Pencil, Search, Sparkles, Trash2, X } from 'lucide-react';
import { api, patch, post } from '@/lib/api';
import type { Me } from '@/lib/types';
import { Avatar, GlassCard, Spinner } from '@/components/ui';
import { useXpToast } from '@/components/xp-toast';

export interface AdminUser {
  id: string;
  name: string;
  nickname?: string;
  email: string;
  phone?: string;
  city?: string;
  birthDate?: string;
  role: string;
  xpTotal: number;
  avatarUrl?: string;
  teamId?: string | null;
  team?: { id: string; name: string; color: string } | null;
  streak?: { current: number } | null;
}

interface Team {
  id: string;
  name: string;
  color: string;
}

// mesma hierarquia do backend — usada para limitar o select de papéis
const ROLE_RANK = [
  'VISITANTE',
  'MEMBRO',
  'VICE_LIDER',
  'LIDER',
  'PASTOR',
  'ADMIN',
] as const;

const ROLE_LABELS: Record<string, string> = {
  ADMIN: '🛡️ Administrador',
  PASTOR: '📖 Pastor',
  LIDER: '⭐ Líder',
  VICE_LIDER: '✨ Vice-líder',
  MEMBRO: '🤝 Membro',
  VISITANTE: '👋 Visitante',
};

function XpAdjuster({
  user,
  onDone,
}: {
  user: AdminUser;
  onDone: () => void;
}) {
  const { show } = useXpToast();
  const [amount, setAmount] = useState(10);
  const [reason, setReason] = useState('');

  const adjust = useMutation({
    mutationFn: (delta: number) =>
      post<{ amount: number; xpTotal: number }>(`/admin/users/${user.id}/xp`, {
        amount: delta,
        reason,
      }),
    onSuccess: (data) => {
      show(
        data.amount > 0 ? `+${data.amount} XP` : `${data.amount} XP`,
        `${user.nickname || user.name} agora tem ${data.xpTotal.toLocaleString('pt-BR')} XP`,
      );
      onDone();
    },
    onError: (e) => show('Ops!', e instanceof Error ? e.message : 'Erro'),
  });

  const valid = amount > 0 && reason.trim().length > 0;

  return (
    <div className="mt-3 space-y-3 rounded-2xl bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-widest text-zinc-500">
        Ajustar XP de {user.nickname || user.name}
      </p>
      <div className="flex items-center gap-3">
        <input
          className="input w-28"
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(Math.abs(Number(e.target.value)))}
          aria-label="Quantidade de XP"
        />
        <span className="text-sm text-gold-400">XP</span>
      </div>
      <input
        className="input"
        placeholder="Motivo (o membro verá esta mensagem)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <div className="flex gap-2">
        <button
          className="btn-gold flex-1 py-2"
          disabled={!valid || adjust.isPending}
          onClick={() => adjust.mutate(amount)}
        >
          + Adicionar
        </button>
        <button
          className="flex-1 rounded-2xl border border-red-500/30 px-4 py-2 font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-40"
          disabled={!valid || adjust.isPending}
          onClick={() => adjust.mutate(-amount)}
        >
          − Descontar
        </button>
      </div>
    </div>
  );
}

function MemberEditor({
  user,
  me,
  teams,
  onDone,
}: {
  user: AdminUser;
  me: Me;
  teams: Team[];
  onDone: () => void;
}) {
  const { show } = useXpToast();
  const [form, setForm] = useState({
    name: user.name,
    nickname: user.nickname ?? '',
    email: user.email,
    phone: user.phone ?? '',
    city: user.city ?? '',
    birthDate: user.birthDate ? user.birthDate.slice(0, 10) : '',
    role: user.role,
    teamId: user.teamId ?? '',
    password: '',
  });
  const set = (patchObj: Partial<typeof form>) =>
    setForm((f) => ({ ...f, ...patchObj }));

  const myRank = ROLE_RANK.indexOf(me.role as (typeof ROLE_RANK)[number]);
  const assignableRoles = ROLE_RANK.filter((_, i) => i <= myRank);

  const save = useMutation({
    mutationFn: () =>
      patch(`/admin/users/${user.id}`, {
        name: form.name,
        nickname: form.nickname || undefined,
        email: form.email,
        phone: form.phone || undefined,
        city: form.city || undefined,
        birthDate: form.birthDate || undefined,
        role: form.role,
        teamId: form.teamId || null,
        ...(form.password ? { password: form.password } : {}),
      }),
    onSuccess: () => {
      show('Cadastro atualizado ✏️', user.nickname || user.name);
      onDone();
    },
    onError: (e) => show('Ops!', e instanceof Error ? e.message : 'Erro'),
  });

  return (
    <div className="mt-3 space-y-3 rounded-2xl bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-widest text-zinc-500">
        Editar cadastro
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          className="input"
          placeholder="Nome"
          value={form.name}
          onChange={(e) => set({ name: e.target.value })}
        />
        <input
          className="input"
          placeholder="Apelido"
          value={form.nickname}
          onChange={(e) => set({ nickname: e.target.value })}
        />
        <input
          className="input"
          type="email"
          placeholder="E-mail"
          value={form.email}
          onChange={(e) => set({ email: e.target.value })}
        />
        <input
          className="input"
          type="tel"
          placeholder="Telefone"
          value={form.phone}
          onChange={(e) => set({ phone: e.target.value })}
        />
        <input
          className="input"
          placeholder="Cidade"
          value={form.city}
          onChange={(e) => set({ city: e.target.value })}
        />
        <input
          className="input"
          type="date"
          aria-label="Data de nascimento"
          value={form.birthDate}
          onChange={(e) => set({ birthDate: e.target.value })}
        />
        <select
          className="input"
          value={form.role}
          onChange={(e) => set({ role: e.target.value })}
          aria-label="Papel"
        >
          {assignableRoles.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
          {!assignableRoles.includes(form.role as never) && (
            <option value={form.role}>{ROLE_LABELS[form.role]}</option>
          )}
        </select>
        <select
          className="input"
          value={form.teamId}
          onChange={(e) => set({ teamId: e.target.value })}
          aria-label="Equipe"
        >
          <option value="">Sem equipe</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <input
        className="input"
        type="password"
        placeholder="Nova senha (deixe em branco para manter)"
        value={form.password}
        onChange={(e) => set({ password: e.target.value })}
        autoComplete="new-password"
      />
      <div className="flex gap-2">
        <button
          className="btn-gold flex-1"
          disabled={!form.name || !form.email || save.isPending}
          onClick={() => save.mutate()}
        >
          {save.isPending ? 'Salvando...' : 'Salvar cadastro'}
        </button>
        <button className="btn-ghost" onClick={onDone}>
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

export function AdminMembers({ me }: { me: Me }) {
  const queryClient = useQueryClient();
  const { show } = useXpToast();
  const [search, setSearch] = useState('');
  const [openPanel, setOpenPanel] = useState<{
    id: string;
    mode: 'edit' | 'xp';
  } | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api<AdminUser[]>('/admin/users'),
  });
  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: () => api<Team[]>('/teams'),
  });

  const refresh = () => {
    setOpenPanel(null);
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['ranking'] });
  };

  const remove = useMutation({
    mutationFn: (id: string) => api(`/admin/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      show('Membro excluído', 'Todos os dados pessoais foram removidos');
      refresh();
    },
    onError: (e) => show('Ops!', e instanceof Error ? e.message : 'Erro ao excluir'),
  });

  const filtered = users?.filter((u) =>
    `${u.name} ${u.nickname ?? ''} ${u.email}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <section className="space-y-3 pt-4">
      <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-zinc-400">
        Membros
      </h2>

      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
        />
        <input
          className="input pl-10"
          placeholder="Buscar por nome ou e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <Spinner />
      ) : (
        <div className="space-y-2">
          {filtered?.map((user) => (
            <GlassCard key={user.id} className="p-4">
              <div className="flex items-center gap-3">
                <Avatar name={user.name} src={user.avatarUrl} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {user.nickname || user.name}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {ROLE_LABELS[user.role]} · {user.email}
                    {user.team ? ` · ${user.team.name}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-sm font-bold gold-text">
                    {user.xpTotal.toLocaleString('pt-BR')} XP
                  </p>
                  <p className="text-[10px] text-zinc-600">
                    🔥 {user.streak?.current ?? 0}
                  </p>
                </div>
                <button
                  className="rounded-xl border border-gold-500/30 p-2 text-gold-300 transition-colors hover:bg-gold-500/10"
                  title="Ajustar XP"
                  onClick={() =>
                    setOpenPanel(
                      openPanel?.id === user.id && openPanel.mode === 'xp'
                        ? null
                        : { id: user.id, mode: 'xp' },
                    )
                  }
                >
                  <Sparkles size={18} />
                </button>
                <button
                  className="rounded-xl border border-white/10 p-2 text-zinc-400 transition-colors hover:text-zinc-200"
                  title="Editar cadastro"
                  onClick={() =>
                    setOpenPanel(
                      openPanel?.id === user.id && openPanel.mode === 'edit'
                        ? null
                        : { id: user.id, mode: 'edit' },
                    )
                  }
                >
                  <Pencil size={18} />
                </button>
                {user.id !== me.id && (
                  <button
                    className="rounded-xl border border-white/10 p-2 text-zinc-500 transition-colors hover:border-red-500/30 hover:text-red-400"
                    title="Excluir membro"
                    onClick={() => {
                      if (
                        confirm(
                          `Excluir ${user.nickname || user.name}? Todos os dados pessoais (XP, badges, pedidos, posts) serão removidos definitivamente.`,
                        )
                      )
                        remove.mutate(user.id);
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

              <AnimatePresence>
                {openPanel?.id === user.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    {openPanel.mode === 'xp' ? (
                      <XpAdjuster user={user} onDone={refresh} />
                    ) : (
                      <MemberEditor
                        user={user}
                        me={me}
                        teams={teams ?? []}
                        onDone={refresh}
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          ))}
          {filtered?.length === 0 && (
            <p className="py-6 text-center text-sm text-zinc-500">
              Nenhum membro encontrado.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
