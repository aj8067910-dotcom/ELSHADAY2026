import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { CreateMissionDto, UpdateMissionDto } from './dto/missions.dto';

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

  /** Lista completa para gestão pela liderança (inclui inativas). */
  manage(churchId: string) {
    return this.prisma.mission.findMany({
      where: { churchId },
      orderBy: [{ frequency: 'asc' }, { createdAt: 'asc' }],
      include: { weeklyChallenge: { select: { id: true, title: true } } },
    });
  }

  /**
   * Cria uma missão. Missões semanais são anexadas ao desafio da semana
   * vigente — se não houver um, ele é criado automaticamente.
   */
  async createMission(churchId: string, dto: CreateMissionDto) {
    let weeklyChallengeId: string | undefined;

    if (dto.frequency === 'SEMANAL') {
      const now = new Date();
      let challenge = await this.prisma.weeklyChallenge.findFirst({
        where: { churchId, startsAt: { lte: now }, endsAt: { gte: now } },
      });
      if (!challenge) {
        challenge = await this.prisma.weeklyChallenge.create({
          data: {
            churchId,
            title: 'Desafio da Semana',
            startsAt: now,
            endsAt: new Date(now.getTime() + 7 * 86_400_000),
          },
        });
      }
      weeklyChallengeId = challenge.id;
    }

    return this.prisma.mission.create({
      data: {
        churchId,
        title: dto.title,
        description: dto.description,
        icon: dto.icon ?? 'target',
        xpReward: dto.xpReward,
        frequency: dto.frequency,
        area: dto.area,
        weeklyChallengeId,
      },
    });
  }

  async updateMission(churchId: string, id: string, dto: UpdateMissionDto) {
    const mission = await this.prisma.mission.findFirst({
      where: { id, churchId },
    });
    if (!mission) throw new NotFoundException('Missão não encontrada.');

    return this.prisma.mission.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.icon !== undefined ? { icon: dto.icon } : {}),
        ...(dto.xpReward !== undefined ? { xpReward: dto.xpReward } : {}),
        ...(dto.frequency !== undefined ? { frequency: dto.frequency } : {}),
        ...(dto.area !== undefined ? { area: dto.area } : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
      },
    });
  }

  async deleteMission(churchId: string, id: string) {
    const mission = await this.prisma.mission.findFirst({
      where: { id, churchId },
    });
    if (!mission) throw new NotFoundException('Missão não encontrada.');

    await this.prisma.$transaction([
      this.prisma.missionCompletion.deleteMany({ where: { missionId: id } }),
      this.prisma.mission.delete({ where: { id } }),
    ]);
    return { ok: true };
  }

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
