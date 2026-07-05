import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { CheckinDto, CreateEventDto, UpdateEventDto } from './dto/events.dto';

const EVENT_AREA: Record<EventType, 'COMUNHAO' | 'EVANGELISMO' | 'ADORACAO' | 'SERVICO'> = {
  CULTO: 'ADORACAO',
  RETIRO: 'COMUNHAO',
  CONGRESSO: 'COMUNHAO',
  ACAMPAMENTO: 'COMUNHAO',
  LAZER: 'COMUNHAO',
  EVANGELISMO: 'EVANGELISMO',
  TREINAMENTO: 'SERVICO',
  REUNIAO: 'COMUNHAO',
};

const FIRST_BADGES: Partial<Record<EventType, string>> = {
  CULTO: 'primeiro-culto',
  RETIRO: 'primeiro-retiro',
};

@Injectable()
export class EventsService {
  constructor(
    private prisma: PrismaService,
    private gamification: GamificationService,
  ) {}

  /**
   * Cria o evento e, se solicitado, as ocorrências semanais seguintes
   * (ex.: culto toda terça por 12 semanas). Cada ocorrência é um evento
   * independente, com sua própria lista de presença e QR de check-in.
   */
  async create(churchId: string, creatorId: string, dto: CreateEventDto) {
    const first = new Date(dto.startsAt);
    const firstEnd = dto.endsAt ? new Date(dto.endsAt) : undefined;
    const repeats = Math.min(dto.repeatWeeklyCount ?? 0, 52);

    const events = await this.prisma.$transaction(
      Array.from({ length: repeats + 1 }, (_, week) => {
        const offset = week * 7 * 86_400_000;
        return this.prisma.event.create({
          data: {
            churchId,
            creatorId,
            type: dto.type,
            title: dto.title,
            description: dto.description,
            bannerUrl: dto.bannerUrl,
            startsAt: new Date(first.getTime() + offset),
            endsAt: firstEnd ? new Date(firstEnd.getTime() + offset) : undefined,
            location: dto.location,
            lat: dto.lat,
            lng: dto.lng,
            xpReward: dto.xpReward ?? 80,
          },
        });
      }),
    );

    return { created: events.length, event: events[0] };
  }

  async update(churchId: string, id: string, dto: UpdateEventDto) {
    const event = await this.prisma.event.findFirst({
      where: { id, churchId },
    });
    if (!event) throw new NotFoundException('Evento não encontrado.');

    return this.prisma.event.update({
      where: { id },
      data: {
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.bannerUrl !== undefined ? { bannerUrl: dto.bannerUrl } : {}),
        ...(dto.startsAt !== undefined ? { startsAt: new Date(dto.startsAt) } : {}),
        ...(dto.endsAt !== undefined ? { endsAt: new Date(dto.endsAt) } : {}),
        ...(dto.location !== undefined ? { location: dto.location } : {}),
        ...(dto.lat !== undefined ? { lat: dto.lat } : {}),
        ...(dto.lng !== undefined ? { lng: dto.lng } : {}),
        ...(dto.xpReward !== undefined ? { xpReward: dto.xpReward } : {}),
      },
    });
  }

  async remove(churchId: string, id: string) {
    const event = await this.prisma.event.findFirst({
      where: { id, churchId },
    });
    if (!event) throw new NotFoundException('Evento não encontrado.');

    await this.prisma.$transaction([
      this.prisma.eventAttendance.deleteMany({ where: { eventId: id } }),
      this.prisma.event.delete({ where: { id } }),
    ]);
    return { ok: true };
  }

  list(churchId: string, userId: string) {
    return this.prisma.event
      .findMany({
        where: { churchId },
        orderBy: { startsAt: 'asc' },
        include: {
          _count: { select: { attendances: true } },
          attendances: { where: { userId }, select: { status: true } },
        },
        take: 50,
      })
      .then((events) =>
        events.map(({ attendances, checkinCode, ...event }) => ({
          ...event,
          myStatus: attendances[0]?.status ?? null,
        })),
      );
  }

  async get(id: string, userId: string, role: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        attendances: {
          include: {
            user: { select: { id: true, name: true, nickname: true, avatarUrl: true } },
          },
        },
      },
    });
    if (!event) throw new NotFoundException('Evento não encontrado.');

    const isLeadership = ['ADMIN', 'PASTOR', 'LIDER', 'VICE_LIDER'].includes(role);
    const { checkinCode, ...rest } = event;
    return {
      ...rest,
      // apenas liderança vê o código para gerar o QR Code
      checkinCode: isLeadership ? checkinCode : undefined,
      myStatus:
        event.attendances.find((a) => a.userId === userId)?.status ?? null,
    };
  }

  /** Confirmação de presença ("Eu vou!"). */
  confirm(userId: string, eventId: string) {
    return this.prisma.eventAttendance.upsert({
      where: { eventId_userId: { eventId, userId } },
      create: { eventId, userId },
      update: {},
    });
  }

  /** Check-in via QR Code: valida o código, credita XP e badges. */
  async checkin(userId: string, dto: CheckinDto) {
    const event = await this.prisma.event.findUnique({
      where: { checkinCode: dto.code },
    });
    if (!event) throw new NotFoundException('QR Code inválido.');

    const existing = await this.prisma.eventAttendance.findUnique({
      where: { eventId_userId: { eventId: event.id, userId } },
    });
    if (existing?.status === 'CHECKIN')
      throw new BadRequestException('Check-in já realizado. 🙌');

    await this.prisma.eventAttendance.upsert({
      where: { eventId_userId: { eventId: event.id, userId } },
      create: {
        eventId: event.id,
        userId,
        status: 'CHECKIN',
        checkedInAt: new Date(),
      },
      update: { status: 'CHECKIN', checkedInAt: new Date() },
    });

    const streak = await this.gamification.touchStreak(userId);
    const xp = await this.gamification.grantXp(
      userId,
      event.xpReward,
      `Check-in: ${event.title}`,
      { area: EVENT_AREA[event.type], refType: 'event', refId: event.id },
    );

    const firstBadge = FIRST_BADGES[event.type];
    if (firstBadge) await this.gamification.grantBadge(userId, firstBadge);
    if (event.type === 'EVANGELISMO')
      await this.gamification.grantBadge(userId, 'evangelista');

    return {
      event: { id: event.id, title: event.title, type: event.type },
      xp,
      streak: { current: streak.current },
    };
  }
}
