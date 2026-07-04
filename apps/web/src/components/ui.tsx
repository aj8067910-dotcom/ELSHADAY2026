'use client';

import { motion } from 'framer-motion';
import clsx from 'clsx';

export function GlassCard({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: 'easeOut' }}
      className={clsx('glass p-5', className)}
    >
      {children}
    </motion.div>
  );
}

export function Avatar({
  name,
  src,
  size = 40,
  className,
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      className={clsx('rounded-full object-cover ring-1 ring-white/10', className)}
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className={clsx(
        'flex items-center justify-center rounded-full bg-gold-gradient font-display font-bold text-ink-950 ring-1 ring-white/10',
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  );
}

export function XpBar({
  progress,
  label,
}: {
  progress: number;
  label?: string;
}) {
  return (
    <div>
      {label && (
        <div className="mb-1.5 flex justify-between text-xs text-zinc-400">
          <span>{label}</span>
          <span>{Math.round(progress * 100)}%</span>
        </div>
      )}
      <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          className="h-full rounded-full bg-gold-gradient shadow-glow"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, progress * 100)}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
        />
      </div>
    </div>
  );
}

export function StreakFlame({ days }: { days: number }) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 16 }}
      className="flex items-center gap-2"
    >
      <span className="text-3xl" role="img" aria-label="streak">
        🔥
      </span>
      <div>
        <div className="font-display text-2xl font-bold gold-text">{days}</div>
        <div className="text-xs text-zinc-400">
          {days === 1 ? 'dia seguido' : 'dias seguidos'}
        </div>
      </div>
    </motion.div>
  );
}

export function Chip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'rounded-full px-4 py-1.5 text-sm font-medium transition-all',
        active
          ? 'bg-gold-gradient text-ink-950 shadow-glow'
          : 'border border-white/10 bg-white/[0.03] text-zinc-300 hover:border-gold-500/30',
      )}
    >
      {children}
    </button>
  );
}

export function EmptyState({
  emoji,
  title,
  subtitle,
}: {
  emoji: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="glass flex flex-col items-center gap-2 p-10 text-center">
      <span className="text-4xl">{emoji}</span>
      <p className="font-display font-semibold text-zinc-200">{title}</p>
      {subtitle && <p className="text-sm text-zinc-500">{subtitle}</p>}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <motion.div
        className="h-10 w-10 rounded-full border-2 border-gold-500/20 border-t-gold-500"
        animate={{ rotate: 360 }}
        transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}
