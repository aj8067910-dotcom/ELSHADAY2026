'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Avatar, GlassCard } from '@/components/ui';

interface AttendanceAlert {
  user: {
    id: string;
    name: string;
    nickname?: string;
    avatarUrl?: string;
    phone?: string;
  };
  weekday: string;
  total: number;
  attended: number;
  missed: number;
  severity: 'alto' | 'medio';
}

export function AdminAlerts() {
  const { data: alerts } = useQuery({
    queryKey: ['attendance-alerts'],
    queryFn: () => api<AttendanceAlert[]>('/admin/attendance-alerts'),
  });

  if (!alerts || alerts.length === 0) return null;

  return (
    <section className="space-y-3 pt-4">
      <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-zinc-400">
        Alertas de presença 💛
      </h2>
      <p className="-mt-1 text-xs text-zinc-600">
        Quem está sentindo falta da comunhão nas últimas 6 semanas — que tal
        uma mensagem ou uma visita?
      </p>
      <div className="space-y-2">
        {alerts.map((alert) => (
          <GlassCard
            key={`${alert.user.id}-${alert.weekday}`}
            className={`p-4 ${
              alert.severity === 'alto'
                ? 'border-red-500/20'
                : 'border-amber-500/15'
            }`}
          >
            <div className="flex items-center gap-3">
              <Avatar
                name={alert.user.name}
                src={alert.user.avatarUrl}
                size={40}
              />
              <div className="flex-1">
                <p className="font-medium">
                  {alert.user.nickname || alert.user.name}
                </p>
                <p className="text-sm text-zinc-400">
                  Faltou{' '}
                  <span
                    className={
                      alert.severity === 'alto'
                        ? 'font-semibold text-red-400'
                        : 'font-semibold text-amber-400'
                    }
                  >
                    {alert.missed} de {alert.total}
                  </span>{' '}
                  cultos de <span className="text-zinc-200">{alert.weekday}</span>
                </p>
              </div>
              {alert.user.phone && (
                <a
                  href={`https://wa.me/${alert.user.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Oi ${(alert.user.nickname || alert.user.name).split(' ')[0]}! Sentimos sua falta no culto. Está tudo bem? 💛`,
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost px-3 py-1.5 text-xs"
                >
                  💬 Mensagem
                </a>
              )}
            </div>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}
