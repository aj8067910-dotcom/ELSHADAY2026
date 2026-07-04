import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const BADGES: Array<[string, string, string, string]> = [
  ['bem-vindo', 'Bem-vindo à família', 'Criou sua conta na plataforma', 'sparkles'],
  ['primeiro-culto', 'Primeiro culto', 'Fez check-in no seu primeiro culto', 'church'],
  ['primeiro-retiro', 'Primeiro retiro', 'Participou do seu primeiro retiro', 'tent'],
  ['devocional-30', '30 dias na Palavra', '30 dias seguidos de devocional', 'book-open'],
  ['streak-5', 'Constância 5', '5 dias seguidos de atividade', 'flame'],
  ['streak-10', 'Constância 10', '10 dias seguidos de atividade', 'flame'],
  ['streak-30', 'Constância 30', '30 dias seguidos de atividade', 'flame'],
  ['streak-100', 'Constância 100', '100 dias seguidos de atividade', 'flame'],
  ['streak-365', 'Um ano de constância', '365 dias seguidos de atividade', 'crown'],
  ['evangelista', 'Evangelista', 'Participou de um evangelismo', 'megaphone'],
  ['servo', 'Servo', 'Serviu em um ministério', 'heart-handshake'],
  ['intercessor', 'Intercessor', 'Orou por 100 pedidos', 'hands-praying'],
  ['leitor-fiel', 'Leitor fiel', 'Completou um plano de leitura', 'book'],
  ['presenca-perfeita', 'Presença perfeita', 'Presente em todos os eventos do mês', 'calendar-check'],
  ['missao-completa', 'Missão completa', 'Concluiu todas as missões do dia', 'target'],
  ['aniversario', 'Feliz aniversário', 'Celebrou seu aniversário conosco', 'cake'],
  ['lider-destaque', 'Líder destaque', 'Reconhecimento da liderança', 'star'],
];

const DAILY_MISSIONS: Array<{
  title: string;
  icon: string;
  xpReward: number;
  area: 'PALAVRA' | 'ORACAO' | 'SERVICO' | 'COMUNHAO' | 'EVANGELISMO' | 'ADORACAO';
}> = [
  { title: 'Fazer o devocional do dia', icon: 'book-open', xpReward: 20, area: 'PALAVRA' },
  { title: 'Orar por 15 minutos', icon: 'hands-praying', xpReward: 15, area: 'ORACAO' },
  { title: 'Ler 1 capítulo da Bíblia', icon: 'book', xpReward: 15, area: 'PALAVRA' },
  { title: 'Enviar mensagem de encorajamento', icon: 'message-heart', xpReward: 10, area: 'COMUNHAO' },
  { title: 'Orar pelo seu parceiro espiritual', icon: 'users', xpReward: 10, area: 'ORACAO' },
  { title: 'Comentar o devocional', icon: 'message-circle', xpReward: 10, area: 'COMUNHAO' },
  { title: 'Convidar alguém para o culto', icon: 'user-plus', xpReward: 25, area: 'EVANGELISMO' },
];

async function main() {
  console.log('🌱 Semeando o banco do Grupo Elshaday...');

  const church = await prisma.church.upsert({
    where: { slug: 'elshaday' },
    update: {},
    create: {
      name: 'Grupo Elshaday',
      slug: 'elshaday',
      city: 'Brasil',
      primaryColor: '#D4AF37',
    },
  });

  for (const [code, name, description, icon] of BADGES) {
    await prisma.badge.upsert({
      where: { code },
      update: {},
      create: { code, name, description, icon, churchId: church.id },
    });
  }

  const teamLeao = await prisma.team.upsert({
    where: { id: 'seed-team-leao' },
    update: {},
    create: {
      id: 'seed-team-leao',
      churchId: church.id,
      name: 'Leões de Judá',
      color: '#D4AF37',
    },
  });
  await prisma.team.upsert({
    where: { id: 'seed-team-aguias' },
    update: {},
    create: {
      id: 'seed-team-aguias',
      churchId: church.id,
      name: 'Águias',
      color: '#8B5CF6',
    },
  });

  const password = await bcrypt.hash('elshaday123', 10);
  const mkUser = (
    id: string,
    email: string,
    name: string,
    role: 'ADMIN' | 'PASTOR' | 'LIDER' | 'MEMBRO',
  ) =>
    prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        id,
        churchId: church.id,
        email,
        name,
        role,
        passwordHash: password,
        teamId: teamLeao.id,
        streak: { create: {} },
      },
    });

  const admin = await mkUser('seed-admin', 'admin@elshaday.app', 'Administrador', 'ADMIN');
  const pastor = await mkUser('seed-pastor', 'pastor@elshaday.app', 'Pr. Samuel', 'PASTOR');
  const lider = await mkUser('seed-lider', 'lider@elshaday.app', 'Ana Líder', 'LIDER');
  await mkUser('seed-membro', 'membro@elshaday.app', 'João Membro', 'MEMBRO');

  await prisma.team.update({
    where: { id: teamLeao.id },
    data: { leaderId: lider.id },
  });

  for (const m of DAILY_MISSIONS) {
    const existing = await prisma.mission.findFirst({
      where: { churchId: church.id, title: m.title },
    });
    if (!existing) {
      await prisma.mission.create({
        data: { churchId: church.id, frequency: 'DIARIA', ...m },
      });
    }
  }

  // Devocional de hoje
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  await prisma.devotional.upsert({
    where: { churchId_date: { churchId: church.id, date: today } },
    update: {},
    create: {
      churchId: church.id,
      authorId: lider.id,
      date: today,
      theme: 'Firmados na Rocha',
      verse:
        'Portanto, quem ouve estas minhas palavras e as pratica é como um homem prudente que construiu a sua casa sobre a rocha.',
      verseRef: 'Mateus 7:24',
      body: 'A constância na Palavra é o alicerce que sustenta a nossa fé nos dias de tempestade. Hoje, separe um momento para meditar em como você tem construído sua vida espiritual: sobre a rocha ou sobre a areia?',
      question: 'O que significa, na prática, construir sobre a rocha esta semana?',
    },
  });

  // Eventos futuros
  const in3days = new Date(Date.now() + 3 * 24 * 3600_000);
  const in10days = new Date(Date.now() + 10 * 24 * 3600_000);
  if (!(await prisma.event.findFirst({ where: { churchId: church.id } }))) {
    await prisma.event.create({
      data: {
        churchId: church.id,
        creatorId: pastor.id,
        type: 'CULTO',
        title: 'Culto de Celebração',
        description: 'Venha celebrar com a gente! Traga um amigo. 🙌',
        startsAt: in3days,
        location: 'Templo Central',
        xpReward: 50,
      },
    });
    await prisma.event.create({
      data: {
        churchId: church.id,
        creatorId: pastor.id,
        type: 'RETIRO',
        title: 'Retiro Firmados na Rocha',
        description: 'Um fim de semana de comunhão, palavra e adoração.',
        startsAt: in10days,
        location: 'Sítio Monte Horebe',
        xpReward: 150,
      },
    });
  }

  // Círculo de oração
  if (!(await prisma.prayerCircle.findFirst({ where: { churchId: church.id } }))) {
    await prisma.prayerCircle.create({
      data: {
        churchId: church.id,
        leaderId: lider.id,
        name: 'Círculo de Oração — Quarta',
        theme: 'Gratidão',
        date: new Date(Date.now() + 2 * 24 * 3600_000),
        location: 'Sala 2',
      },
    });
  }

  // Desafio da semana
  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 24 * 3600_000);
  if (!(await prisma.weeklyChallenge.findFirst({ where: { churchId: church.id } }))) {
    const challenge = await prisma.weeklyChallenge.create({
      data: {
        churchId: church.id,
        title: 'Semana da Gratidão',
        theme: 'Em tudo dai graças (1 Ts 5:18)',
        startsAt: now,
        endsAt: weekEnd,
      },
    });
    const weekly = [
      { title: 'Agradecer a 5 pessoas', icon: 'heart', xpReward: 30, area: 'COMUNHAO' as const },
      { title: 'Ler Filipenses', icon: 'book-open', xpReward: 40, area: 'PALAVRA' as const },
      { title: 'Participar do círculo de oração', icon: 'hands-praying', xpReward: 40, area: 'ORACAO' as const },
      { title: 'Servir alguém esta semana', icon: 'heart-handshake', xpReward: 50, area: 'SERVICO' as const },
    ];
    for (const m of weekly) {
      await prisma.mission.create({
        data: {
          churchId: church.id,
          frequency: 'SEMANAL',
          weeklyChallengeId: challenge.id,
          ...m,
        },
      });
    }
  }

  // Temporada vigente
  if (!(await prisma.season.findFirst({ where: { churchId: church.id } }))) {
    await prisma.season.create({
      data: {
        churchId: church.id,
        name: 'Temporada Firmados na Rocha',
        verse: 'Mateus 7:24',
        theme: 'Constância que sustenta',
        startsAt: now,
        endsAt: new Date(now.getTime() + 90 * 24 * 3600_000),
      },
    });
  }

  console.log('✅ Seeds concluídas.');
  console.log('   Logins: admin@elshaday.app / pastor@elshaday.app /');
  console.log('           lider@elshaday.app / membro@elshaday.app');
  console.log('   Senha:  elshaday123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
