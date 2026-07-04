import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';

function todayDate(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

@Injectable()
export class MissionsService {
  constructor(
    private prisma: PrismaService,
    private gamification: GamificationService,
  ) {}

  /** Missões do dia com estado de conclusão do usuário. */
  async daily(churchId: string, userId: string) {
    const missions = await this.prisma.mission.findMany({
      where: { churchId, active: true, frequency: 'DIARIA' },
      orderBy: { xpReward: 'asc' },
    });
    const completions = await this.prisma.missionCompletion.findMany({
      where: {
        userId,
        date: todayDate(),
        missionId: { in: missions.map((m) => m.id) },
      },
    });
    const done = new Set(completions.map((c) => c.missionId));
    return missions.map((m) => ({ ...m, completed: done.has(m.id) }));
  }

  /** Desafio da semana vigente com progresso. */
  async weeklyChallenge(churchId: string, userId: string) {
    const now = new Date();
    const challenge = await this.prisma.weeklyChallenge.findFirst({
      where: { churchId, startsAt: { lte: now }, endsAt: { gte: now } },
      include: { missions: true },
    });
    if (!challenge) return null;

    const completions = await this.prisma.missionCompletion.findMany({
      where: {
        userId,
        missionId: { in: challenge.missions.map((m) => m.id) },
        createdAt: { gte: challenge.startsAt },
      },
    });
    const done = new Set(completions.map((c) => c.missionId));
    return {
      ...challenge,
      missions: challenge.missions.map((m) => ({
        ...m,
        completed: done.has(m.id),
      })),
      progress: challenge.missions.length
        ? done.size / challenge.missions.length
        : 0,
    };
  }

  async complete(userId: string, missionId: string) {
    const mission = await this.prisma.mission.findUnique({
      where: { id: missionId },
    });
    if (!mission) throw new NotFoundException('Missão não encontrada.');

    try {
      await this.prisma.missionCompletion.create({
        data: { missionId, userId, date: todayDate() },
      });
    } catch {
      throw new ConflictException('Missão já concluída hoje. ✅');
    }

    const streak = await this.gamification.touchStreak(userId);
    const xp = await this.gamification.grantXp(
      userId,
      mission.xpReward,
      `Missão: ${mission.title}`,
      { area: mission.area, refType: 'mission', refId: missionId },
    );

    // completou todas as missões diárias de hoje? → badge + caixa de bênçãos
    const [totalDaily, doneToday] = await Promise.all([
      this.prisma.mission.count({
        where: { churchId: mission.churchId, active: true, frequency: 'DIARIA' },
      }),
      this.prisma.missionCompletion.count({
        where: { userId, date: todayDate(), mission: { frequency: 'DIARIA' } },
      }),
    ]);
    const allDone = totalDaily > 0 && doneToday >= totalDaily;
    if (allDone) await this.gamification.grantBadge(userId, 'missao-completa');

    return { xp, streak: { current: streak.current }, allDailyDone: allDone };
  }
}
