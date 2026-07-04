import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { XP_REWARDS } from '../gamification/levels';
import {
  CreateCircleDto,
  CreatePrayerRequestDto,
  UpdatePrayerRequestDto,
} from './dto/prayer.dto';

const LEADERSHIP = ['ADMIN', 'PASTOR', 'LIDER', 'VICE_LIDER'];

@Injectable()
export class PrayerService {
  constructor(
    private prisma: PrismaService,
    private gamification: GamificationService,
  ) {}

  async createRequest(
    churchId: string,
    userId: string,
    dto: CreatePrayerRequestDto,
  ) {
    const request = await this.prisma.prayerRequest.create({
      data: {
        churchId,
        userId,
        title: dto.title,
        body: dto.body,
        visibility: dto.visibility ?? 'PUBLICO',
        live: dto.live ?? false,
      },
    });
    await this.gamification.grantXp(
      userId,
      XP_REWARDS.ORACAO,
      'Pedido de oração compartilhado',
      { area: 'ORACAO', refType: 'prayer', refId: request.id },
    );
    return request;
  }

  /** Lista respeitando a visibilidade (privado / somente liderança). */
  list(churchId: string, userId: string, role: string) {
    const isLeadership = LEADERSHIP.includes(role);
    return this.prisma.prayerRequest.findMany({
      where: {
        churchId,
        OR: [
          { visibility: 'PUBLICO' },
          { userId },
          ...(isLeadership ? [{ visibility: 'LIDERANCA' as const }] : []),
        ],
      },
      orderBy: [{ live: 'desc' }, { createdAt: 'desc' }],
      include: {
        user: { select: { id: true, name: true, nickname: true, avatarUrl: true } },
        _count: { select: { intercessions: true } },
      },
      take: 50,
    });
  }

  async update(userId: string, id: string, dto: UpdatePrayerRequestDto) {
    const request = await this.prisma.prayerRequest.findUnique({
      where: { id },
    });
    if (!request) throw new NotFoundException('Pedido não encontrado.');
    if (request.userId !== userId)
      throw new ForbiddenException('Apenas o autor pode atualizar o pedido.');

    const updated = await this.prisma.prayerRequest.update({
      where: { id },
      data: dto,
    });

    if (dto.answered && !request.answered) {
      await this.gamification.grantXp(
        userId,
        XP_REWARDS.TESTEMUNHO,
        'Oração respondida — testemunho registrado',
        { area: 'ORACAO', refType: 'prayer', refId: id },
      );
    }
    return updated;
  }

  /** "Já orei" — intercessão por um pedido, com contagem para o autor. */
  async intercede(userId: string, requestId: string) {
    const request = await this.prisma.prayerRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Pedido não encontrado.');

    await this.prisma.prayerIntercession.upsert({
      where: { requestId_userId: { requestId, userId } },
      create: { requestId, userId },
      update: {},
    });

    const count = await this.prisma.prayerIntercession.count({
      where: { requestId },
    });

    if (request.userId !== userId) {
      await this.prisma.notification.create({
        data: {
          userId: request.userId,
          title: `${count} ${count === 1 ? 'pessoa orou' : 'pessoas oraram'} por você 🙏`,
          kind: 'parabens',
        },
      });
      await this.gamification.grantXp(
        userId,
        XP_REWARDS.INTERCESSAO,
        'Intercessão por um irmão',
        { area: 'ORACAO', refType: 'prayer', refId: requestId },
      );
    }
    return { count };
  }

  createCircle(churchId: string, leaderId: string, dto: CreateCircleDto) {
    return this.prisma.prayerCircle.create({
      data: {
        churchId,
        leaderId,
        name: dto.name,
        theme: dto.theme,
        date: new Date(dto.date),
        location: dto.location,
        online: dto.online ?? false,
        materials: dto.materials,
        verses: dto.verses,
      },
    });
  }

  listCircles(churchId: string) {
    return this.prisma.prayerCircle.findMany({
      where: { churchId },
      orderBy: { date: 'asc' },
      include: {
        leader: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { attendances: true } },
      },
    });
  }

  async attendCircle(userId: string, circleId: string) {
    const circle = await this.prisma.prayerCircle.findUnique({
      where: { id: circleId },
    });
    if (!circle) throw new NotFoundException('Círculo não encontrado.');

    await this.prisma.circleAttendance.upsert({
      where: { circleId_userId: { circleId, userId } },
      create: { circleId, userId },
      update: {},
    });
    const streak = await this.gamification.touchStreak(userId);
    const xp = await this.gamification.grantXp(
      userId,
      XP_REWARDS.CIRCULO_ORACAO,
      `Círculo de oração: ${circle.name}`,
      { area: 'ORACAO', refType: 'circle', refId: circleId },
    );
    return { xp, streak: { current: streak.current } };
  }
}
