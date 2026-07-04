import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { GamificationService } from './gamification.service';
import { levelFromXp } from './levels';

@ApiTags('gamification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('gamification')
export class GamificationController {
  constructor(
    private gamification: GamificationService,
    private prisma: PrismaService,
  ) {}

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.gamification.summary(user.id);
  }

  /**
   * Ranking saudável: mostra progresso e incentivo, nunca "quem é mais
   * espiritual". Filtros por equipe e período.
   */
  @Get('ranking')
  async ranking(
    @CurrentUser() user: AuthUser,
    @Query('teamId') teamId?: string,
    @Query('period') period?: 'mes' | 'ano',
  ) {
    if (period) {
      const since = new Date();
      if (period === 'mes') since.setMonth(since.getMonth() - 1);
      else since.setFullYear(since.getFullYear() - 1);

      const grouped = await this.prisma.xpTransaction.groupBy({
        by: ['userId'],
        where: {
          createdAt: { gte: since },
          user: { churchId: user.churchId, ...(teamId ? { teamId } : {}) },
        },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: 20,
      });
      const users = await this.prisma.user.findMany({
        where: { id: { in: grouped.map((g) => g.userId) } },
        select: { id: true, name: true, nickname: true, avatarUrl: true, teamId: true },
      });
      return grouped.map((g, i) => ({
        position: i + 1,
        xp: g._sum.amount ?? 0,
        user: users.find((u) => u.id === g.userId),
      }));
    }

    const users = await this.prisma.user.findMany({
      where: { churchId: user.churchId, ...(teamId ? { teamId } : {}) },
      orderBy: { xpTotal: 'desc' },
      take: 20,
      select: {
        id: true,
        name: true,
        nickname: true,
        avatarUrl: true,
        xpTotal: true,
        teamId: true,
      },
    });
    return users.map((u, i) => ({
      position: i + 1,
      xp: u.xpTotal,
      level: levelFromXp(u.xpTotal),
      user: u,
    }));
  }
}
