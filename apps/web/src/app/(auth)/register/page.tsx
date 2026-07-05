'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { post, setTokens } from '@/lib/api';

interface Form {
  name: string;
  nickname?: string;
  email: string;
  password: string;
  birthDate?: string;
  phone?: string;
  city?: string;
}

export default function RegisterPage() {
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
      const payload = {
        ...data,
        birthDate: data.birthDate || undefined,
        nickname: data.nickname || undefined,
        phone: data.phone || undefined,
        city: data.city || undefined,
      };
      const tokens = await post<{ accessToken: string; refreshToken: string }>(
        '/auth/register',
        payload,
      );
      setTokens(tokens.accessToken, tokens.refreshToken);
      router.replace('/home');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível cadastrar.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="mb-8 text-center">
        <h1 className="font-display text-2xl font-bold brand-text">
          Bem-vindo à família 🤍
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Crie sua conta e comece sua jornada.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="glass space-y-4 p-6">
        <input
          className="input"
          placeholder="Nome completo"
          {...register('name', { required: true })}
        />
        <input
          className="input"
          placeholder="Apelido (como te chamam)"
          {...register('nickname')}
        />
        <input
          className="input"
          type="email"
          placeholder="E-mail"
          autoComplete="email"
          {...register('email', { required: true })}
        />
        <input
          className="input"
          type="password"
          placeholder="Senha (mínimo 8 caracteres)"
          autoComplete="new-password"
          {...register('password', { required: true, minLength: 8 })}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            className="input"
            type="date"
            aria-label="Data de nascimento"
            {...register('birthDate')}
          />
          <input className="input" placeholder="Cidade" {...register('city')} />
        </div>
        <input
          className="input"
          type="tel"
          placeholder="Telefone"
          {...register('phone')}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button className="btn-brand w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Criando conta...' : 'Começar a jornada ✨'}
        </button>
        <p className="text-center text-sm text-zinc-500">
          Já tem conta?{' '}
          <Link href="/login" className="text-brand-300 hover:underline">
            Entrar
          </Link>
        </p>
      </form>
    </motion.div>
  );
}
