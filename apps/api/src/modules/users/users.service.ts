import { Injectable, NotFoundException } from '@nestjs/common';
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
      select: { ...PUBLIC_SELECT, email: true, phone: true, birthDate: true },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    return { ...user, level: levelFromXp(user.xpTotal) };
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

  /** Aniversariantes do dia — a Home celebra junto. 🎂 */
  async birthdaysToday(churchId: string) {
    const users = await this.prisma.user.findMany({
      where: { churchId, birthDate: { not: null } },
      select: { id: true, name: true, nickname: true, avatarUrl: true, birthDate: true },
    });
    const today = new Date();
    return users.filter(
      (u) =>
        u.birthDate!.getUTCDate() === today.getUTCDate() &&
        u.birthDate!.getUTCMonth() === today.getUTCMonth(),
    );
  }
}
