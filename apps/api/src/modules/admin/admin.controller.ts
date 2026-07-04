import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('LIDER')
@Controller('admin')
export class AdminController {
  constructor(private prisma: PrismaService) {}

  /** Painel com os principais indicadores de engajamento da igreja. */
  @Get('dashboard')
  async dashboard(@CurrentUser() user: AuthUser) {
    const churchId = user.churchId;
    const weekAgo = new Date(Date.now() - 7 * 24 * 3600_000);

    const [
      totalUsers,
      activeUsers,
      devotionalsWeek,
      prayerRequests,
      answeredPrayers,
      upcomingEvents,
      checkinsWeek,
      xpWeek,
      topStreaks,
    ] = await Promise.all([
      this.prisma.user.count({ where: { churchId } }),
      this.prisma.xpTransaction
        .groupBy({
          by: ['userId'],
          where: { createdAt: { gte: weekAgo }, user: { churchId } },
        })
        .then((g) => g.length),
      this.prisma.devotionalCompletion.count({
        where: { completedAt: { gte: weekAgo }, user: { churchId } },
      }),
      this.prisma.prayerRequest.count({ where: { churchId } }),
      this.prisma.prayerRequest.count({ where: { churchId, answered: true } }),
      this.prisma.event.count({
        where: { churchId, startsAt: { gte: new Date() } },
      }),
      this.prisma.eventAttendance.count({
        where: {
          status: 'CHECKIN',
          checkedInAt: { gte: weekAgo },
          event: { churchId },
        },
      }),
      this.prisma.xpTransaction
        .aggregate({
          where: { createdAt: { gte: weekAgo }, user: { churchId } },
          _sum: { amount: true },
        })
        .then((r) => r._sum.amount ?? 0),
      this.prisma.streak.findMany({
        where: { user: { churchId } },
        orderBy: { current: 'desc' },
        take: 5,
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      }),
    ]);

    return {
      totalUsers,
      activeUsersWeek: activeUsers,
      devotionalsWeek,
      prayerRequests,
      answeredPrayers,
      upcomingEvents,
      checkinsWeek,
      xpWeek,
      topStreaks,
    };
  }

  /** Relatório de participação em CSV (frequência e engajamento). */
  @Get('reports/participation.csv')
  async participationCsv(@CurrentUser() user: AuthUser) {
    const users = await this.prisma.user.findMany({
      where: { churchId: user.churchId },
      include: {
        streak: true,
        _count: {
          select: {
            devotionalEntries: true,
            eventAttendances: true,
            prayerRequests: true,
            missionEntries: true,
          },
        },
      },
      orderBy: { xpTotal: 'desc' },
    });

    const header =
      'nome,email,equipe,xp,streak_atual,devocionais,eventos,pedidos_oracao,missoes';
    const rows = users.map((u) =>
      [
        JSON.stringify(u.name),
        u.email,
        u.teamId ?? '',
        u.xpTotal,
        u.streak?.current ?? 0,
        u._count.devotionalEntries,
        u._count.eventAttendances,
        u._count.prayerRequests,
        u._count.missionEntries,
      ].join(','),
    );
    return [header, ...rows].join('\n');
  }
}
