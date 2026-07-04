'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, Plus } from 'lucide-react';
import { api, post } from '@/lib/api';
import { Avatar, EmptyState, GlassCard, Spinner } from '@/components/ui';
import { useXpToast } from '@/components/xp-toast';

interface Post {
  id: string;
  type: string;
  body?: string;
  mediaUrl?: string;
  createdAt: string;
  author: { id: string; name: string; nickname?: string; avatarUrl?: string };
  comments: Array<{
    id: string;
    body: string;
    author: { name: string; nickname?: string };
  }>;
  reactions: Array<{ userId: string; emoji: string }>;
  _count: { comments: number; reactions: number };
}

const TYPES = [
  ['TESTEMUNHO', '💬 Testemunho'],
  ['VERSICULO', '📖 Versículo'],
  ['FOTO', '📷 Foto'],
  ['PEDIDO', '🙏 Pedido'],
] as const;

export default function MuralPage() {
  const queryClient = useQueryClient();
  const { show } = useXpToast();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>('TESTEMUNHO');
  const [body, setBody] = useState('');
  const [commenting, setCommenting] = useState<string | null>(null);
  const [comment, setComment] = useState('');

  const { data: posts, isLoading } = useQuery({
    queryKey: ['feed'],
    queryFn: () => api<Post[]>('/feed'),
  });

  const create = useMutation({
    mutationFn: () => post('/feed', { type, body }),
    onSuccess: () => {
      setOpen(false);
      setBody('');
      show('Publicado no mural! ✨');
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const react = useMutation({
    mutationFn: (id: string) => post(`/feed/${id}/react`, { emoji: '🙌' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  });

  const sendComment = useMutation({
    mutationFn: (id: string) => post(`/feed/${id}/comments`, { body: comment }),
    onSuccess: () => {
      setComment('');
      setCommenting(null);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-500">
            Mural
          </p>
          <h1 className="font-display text-2xl font-bold">
            A vida da <span className="gold-text">família</span> 📸
          </h1>
        </div>
        <button className="btn-gold px-4 py-2" onClick={() => setOpen(!open)}>
          <Plus size={18} />
          Publicar
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
              <div className="flex flex-wrap gap-2 text-xs">
                {TYPES.map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setType(value)}
                    className={`rounded-full px-3 py-1.5 transition-colors ${
                      type === value
                        ? 'bg-gold-gradient font-semibold text-ink-950'
                        : 'border border-white/10 text-zinc-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <textarea
                className="input min-h-24"
                placeholder="Compartilhe com a família..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
              <button
                className="btn-gold w-full"
                disabled={!body || create.isPending}
                onClick={() => create.mutate()}
              >
                Publicar ✨
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {posts && posts.length > 0 ? (
        <div className="space-y-3">
          {posts.map((p, i) => (
            <GlassCard key={p.id} delay={i * 0.04}>
              <div className="flex items-center gap-3">
                <Avatar name={p.author.name} src={p.author.avatarUrl} size={38} />
                <div>
                  <p className="text-sm font-semibold">
                    {p.author.nickname || p.author.name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {new Date(p.createdAt).toLocaleDateString('pt-BR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
              {p.body && (
                <p className="mt-3 whitespace-pre-line text-zinc-200">{p.body}</p>
              )}
              {p.mediaUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.mediaUrl}
                  alt=""
                  className="mt-3 max-h-96 w-full rounded-2xl object-cover"
                />
              )}
              <div className="mt-3 flex items-center gap-4 border-t border-white/[0.05] pt-3 text-sm text-zinc-500">
                <button
                  onClick={() => react.mutate(p.id)}
                  className="flex items-center gap-1.5 transition-transform hover:text-gold-300 active:scale-90"
                >
                  🙌 {p._count.reactions}
                </button>
                <button
                  onClick={() =>
                    setCommenting(commenting === p.id ? null : p.id)
                  }
                  className="flex items-center gap-1.5 hover:text-zinc-300"
                >
                  <MessageCircle size={16} /> {p._count.comments}
                </button>
              </div>
              {p.comments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {p.comments.map((c) => (
                    <p key={c.id} className="rounded-xl bg-white/[0.03] px-3 py-2 text-sm">
                      <span className="font-semibold text-zinc-300">
                        {c.author.nickname || c.author.name}
                      </span>{' '}
                      <span className="text-zinc-400">{c.body}</span>
                    </p>
                  ))}
                </div>
              )}
              {commenting === p.id && (
                <div className="mt-3 flex gap-2">
                  <input
                    className="input flex-1 py-2"
                    placeholder="Escreva um comentário..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && comment && sendComment.mutate(p.id)
                    }
                  />
                  <button
                    className="btn-gold px-4 py-2"
                    disabled={!comment || sendComment.isPending}
                    onClick={() => sendComment.mutate(p.id)}
                  >
                    Enviar
                  </button>
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      ) : (
        <EmptyState
          emoji="📸"
          title="O mural está esperando por você"
          subtitle="Compartilhe um testemunho ou versículo."
        />
      )}
    </div>
  );
}
