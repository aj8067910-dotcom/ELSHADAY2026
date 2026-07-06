import { Injectable, NotFoundException } from '@nestjs/common';
import { todayBrt } from '../../common/brt';
import { PrismaService } from '../../prisma/prisma.service';
import { levelFromXp } from '../gamification/levels';

const PUBLIC_SELECT = {
  id: true,
  name: true,
  nickname: true,
  avatarUrl: true,
  bannerUrl: true,
  bio: true,
  favoriteVerse: true,
  city: true,
  role: true,
  xpTotal: true,
  joinedChurchAt: true,
  team: { select: { id: true, name: true, color: true } },
  leader: { select: { id: true, name: true } },
} as const;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async me(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        ...PUBLIC_SELECT,
        email: true,
        phone: true,
        birthDate: true,
        duoPartnerId: true,
      },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    const duoPartner = user.duoPartnerId
      ? await this.prisma.user.findUnique({
          where: { id: user.duoPartnerId },
          select: { id: true, name: true, nickname: true, avatarUrl: true },
        })
      : null;

    return { ...user, duoPartner, level: levelFromXp(user.xpTotal) };
  }

  /** Membros da igreja — para escolher parceiro espiritual, escalas etc. */
  listMembers(churchId: string) {
    return this.prisma.user.findMany({
      where: { churchId },
      select: {
        id: true,
        name: true,
        nickname: true,
        avatarUrl: true,
        role: true,
        teamId: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  /** Define (ou remove) o parceiro espiritual do usuário. */
  async setDuoPartner(userId: string, churchId: string, partnerId: string | null) {
    if (partnerId) {
      if (partnerId === userId)
        throw new NotFoundException('Escolha outra pessoa como parceiro. 🙂');
      const partner = await this.prisma.user.findFirst({
        where: { id: partnerId, churchId },
        select: { id: true, name: true },
      });
      if (!partner) throw new NotFoundException('Parceiro não encontrado.');

      const me = await this.prisma.user.update({
        where: { id: userId },
        data: { duoPartnerId: partnerId },
        select: { name: true, nickname: true },
      });
      await this.prisma.notification.create({
        data: {
          userId: partnerId,
          title: `${me.nickname || me.name} escolheu você como parceiro espiritual 🤝`,
          body: 'Orem um pelo outro todos os dias!',
          kind: 'parabens',
        },
      });
      return { duoPartnerId: partnerId };
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { duoPartnerId: null },
    });
    return { duoPartnerId: null };
  }

  async profile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        ...PUBLIC_SELECT,
        userBadges: {
          include: { badge: true },
          orderBy: { earnedAt: 'desc' },
        },
        streak: true,
        growthAreas: true,
      },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    return { ...user, level: levelFromXp(user.xpTotal) };
  }

  updateMe(
    id: string,
    data: {
      name?: string;
      nickname?: string;
      bio?: string;
      favoriteVerse?: string;
      avatarUrl?: string;
      bannerUrl?: string;
      phone?: string;
      city?: string;
    },
  ) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: PUBLIC_SELECT,
    });
  }

  /** Aniversariantes do dia (calendário de Brasília) — a Home celebra junto. 🎂 */
  async birthdaysToday(churchId: string) {
    const users = await this.prisma.user.findMany({
      where: { churchId, birthDate: { not: null } },
      select: { id: true, name: true, nickname: true, avatarUrl: true, birthDate: true },
    });
    const today = todayBrt();
    return users.filter(
      (u) =>
        u.birthDate!.getUTCDate() === today.getUTCDate() &&
        u.birthDate!.getUTCMonth() === today.getUTCMonth(),
    );
  }
}
