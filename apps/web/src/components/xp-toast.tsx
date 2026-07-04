'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { createContext, useCallback, useContext, useState } from 'react';
import { celebrate } from './celebrate';
import type { XpGrant } from '@/lib/types';

interface Toast {
  id: number;
  text: string;
  sub?: string;
}

const XpToastContext = createContext<{
  showXp: (grant: XpGrant) => void;
  show: (text: string, sub?: string) => void;
}>({ showXp: () => {}, show: () => {} });

export function useXpToast() {
  return useContext(XpToastContext);
}

export function XpToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((text: string, sub?: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, sub }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const showXp = useCallback(
    (grant: XpGrant) => {
      celebrate(grant.leveledUp);
      show(
        `+${grant.amount} XP`,
        grant.leveledUp
          ? `Nível ${grant.level} — ${grant.levelTitle}! 🎉`
          : undefined,
      );
    },
    [show],
  );

  return (
    <XpToastContext.Provider value={{ showXp, show }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-6 z-[100] flex flex-col items-center gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="glass flex items-center gap-3 px-6 py-3"
            >
              <span className="font-display text-lg font-bold gold-text">
                {toast.text}
              </span>
              {toast.sub && (
                <span className="text-sm text-zinc-300">{toast.sub}</span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </XpToastContext.Provider>
  );
}
