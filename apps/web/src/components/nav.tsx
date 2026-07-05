'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  CalendarDays,
  Home,
  Image as ImageIcon,
  LogOut,
  Shield,
  Sparkles,
  Target,
  Trophy,
  User,
} from 'lucide-react';
import clsx from 'clsx';
import { api, clearTokens, post } from '@/lib/api';
import type { Me } from '@/lib/types';
import { LEADERSHIP_ROLES } from '@/lib/types';

const ITEMS = [
  { href: '/home', label: 'Início', icon: Home },
  { href: '/devocional', label: 'Devocional', icon: BookOpen },
  { href: '/missoes', label: 'Missões', icon: Target },
  { href: '/oracao', label: 'Oração', icon: Sparkles },
  { href: '/eventos', label: 'Eventos', icon: CalendarDays },
  { href: '/mural', label: 'Mural', icon: ImageIcon },
  { href: '/ranking', label: 'Jornada', icon: Trophy },
  { href: '/perfil', label: 'Perfil', icon: User },
];

// No desktop: sidebar de vidro. No mobile: bottom tab bar (estilo app).
export function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => api<Me>('/users/me'),
    staleTime: 5 * 60_000,
  });
  const items = [
    ...ITEMS,
    ...(me && LEADERSHIP_ROLES.includes(me.role)
      ? [{ href: '/admin', label: 'Admin', icon: Shield }]
      : []),
  ];

  const logout = async () => {
    try {
      await post('/auth/logout');
    } catch {
      /* já deslogado */
    }
    clearTokens();
    router.replace('/login');
  };

  return (
    <>
      {/* sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col gap-1 border-r border-white/[0.06] bg-ink-900/70 p-4 backdrop-blur-xl lg:flex">
        <Link href="/home" className="mb-6 flex items-center gap-2 px-3 pt-2">
          <span className="text-2xl">✨</span>
          <span className="font-display text-lg font-bold gold-text">
            ELSHADAY
          </span>
        </Link>
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'text-gold-300'
                  : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200',
              )}
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-2xl border border-gold-500/20 bg-gold-500/10"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <Icon size={18} className="relative" />
              <span className="relative">{label}</span>
            </Link>
          );
        })}
        <button
          onClick={logout}
          className="mt-auto flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-zinc-500 transition-colors hover:text-zinc-200"
        >
          <LogOut size={18} />
          Sair
        </button>
      </aside>

      {/* bottom bar mobile */}
      <nav className="fixed inset-x-3 bottom-3 z-40 flex justify-around rounded-3xl border border-white/[0.08] bg-ink-900/85 px-2 py-2 backdrop-blur-xl lg:hidden">
        {ITEMS.slice(0, 5).map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1.5 text-[10px] font-medium transition-colors',
                active ? 'text-gold-300' : 'text-zinc-500',
              )}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
        <Link
          href="/perfil"
          className={clsx(
            'flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1.5 text-[10px] font-medium transition-colors',
            pathname.startsWith('/perfil') ? 'text-gold-300' : 'text-zinc-500',
          )}
        >
          <User size={20} />
          Perfil
        </Link>
      </nav>
    </>
  );
}
