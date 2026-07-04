'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { post, setTokens } from '@/lib/api';

interface Form {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<Form>();

  const onSubmit = async (data: Form) => {
    setError('');
    try {
      const tokens = await post<{ accessToken: string; refreshToken: string }>(
        '/auth/login',
        data,
      );
      setTokens(tokens.accessToken, tokens.refreshToken);
      router.replace('/home');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível entrar.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="mb-10 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.15 }}
          className="mb-4 text-5xl"
        >
          ✨
        </motion.div>
        <h1 className="font-display text-3xl font-bold gold-text">
          GRUPO ELSHADAY
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Constância, comunhão e crescimento — todos os dias.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="glass space-y-4 p-6">
        <input
          className="input"
          type="email"
          placeholder="Seu e-mail"
          autoComplete="email"
          {...register('email', { required: true })}
        />
        <input
          className="input"
          type="password"
          placeholder="Sua senha"
          autoComplete="current-password"
          {...register('password', { required: true })}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button className="btn-gold w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </button>
        <div className="flex items-center justify-between text-sm">
          <Link href="/register" className="text-gold-300 hover:underline">
            Criar conta
          </Link>
          <button type="button" className="text-zinc-500 hover:text-zinc-300">
            Esqueci a senha
          </button>
        </div>
      </form>

      <p className="mt-6 text-center text-xs text-zinc-600">
        Login com Google e Apple em breve. 🚀
      </p>
    </motion.div>
  );
}
