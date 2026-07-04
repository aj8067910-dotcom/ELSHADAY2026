'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Nav } from '@/components/nav';
import { XpToastProvider } from '@/components/xp-toast';
import { getToken } from '@/lib/api';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) return null;

  return (
    <XpToastProvider>
      <Nav />
      <main className="lg:pl-60">
        <div className="mx-auto max-w-3xl px-4 pb-28 pt-6 lg:pt-10">
          {children}
        </div>
      </main>
    </XpToastProvider>
  );
}
