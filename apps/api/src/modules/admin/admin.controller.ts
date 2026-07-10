import {
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { HIERARCHY, RolesGuard } from '../../common/guards/roles.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { AdjustXpDto, AdminUpdateUserDto } from './dto/admin.dto';

const rank = (role: string) => HIERARCHY.indexOf(role as Role);

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('LIDER')
@Controller('admin')
export class AdminController {
  constructor(
    private prisma: PrismaService,
    private gamification: GamificationService,
  ) {}

  /** Lista completa de membros para gestão. */
  @Get('users')
  users(@CurrentUser() user: AuthUser) {
    return this.prisma.user.findMany({
      where: { churchId: user.churchId },
      select: {
        id: true,
        name: true,
        nickname: true,
        email: true,
        phone: true,
        city: true,
        birthDate: true,
        role: true,
        xpTotal: true,
        avatarUrl: true,
        teamId: true,
        leaderId: true,
        createdAt: true,
        team: { select: { id: true, name: true, color: true } },
        streak: { select: { current: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Edita o cadastro de qualquer membro da igreja.
   * Regras: não é possível editar alguém acima de você na hierarquia,
   * nem conceder um papel acima do seu.
   */
  @Patch('users/:id')
  async updateUser(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body() dto: AdminUpdateUserDto,
  ) {
    const target = await this.prisma.user.findFirst({
      where: { id, churchId: actor.churchId },
    });
    if (!target) throw new NotFoundException('Membro não encontrado.');

    if (target.id !== actor.id && rank(target.role) > rank(actor.role)) {
      throw new ForbiddenException(
        'Você não pode editar alguém acima de você na hierarquia.',
      );
    }
    if (dto.role && rank(dto.role) > rank(actor.role)) {
      throw new ForbiddenException(
        'Você não pode conceder um papel acima do seu.',
      );
    }

    try {
      return await this.prisma.user.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.nickname !== undefined ? { nickname: dto.nickname } : {}),
          ...(dto.email !== undefined ? { email: dto.email } : {}),
          ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
          ...(dto.city !== undefined ? { city: dto.city } : {}),
          ...(dto.birthDate !== undefined
            ? { birthDate: dto.birthDate ? new Date(dto.birthDate) : null }
            : {}),
          ...(dto.role !== undefined ? { role: dto.role } : {}),
          ...(dto.teamId !== undefined ? { teamId: dto.teamId || null } : {}),
          ...(dto.leaderId !== undefined
            ? { leaderId: dto.leaderId || null }
            : {}),
          ...(dto.password
            ? { passwordHash: await bcrypt.hash(dto.password, 10) }
            : {}),
        },
        select: {
          id: true,
          name: true,
          nickname: true,
          email: true,
          role: true,
          teamId: true,
          xpTotal: true,
        },
      });
    } catch (e: any) {
      if (e?.code === 'P2002')
        throw new ConflictException('Este e-mail já está em uso.');
      throw e;
    }
  }

  /**
   * Exclui um membro definitivamente. Dados pessoais são removidos
   * (LGPD); conteúdo institucional que ele criou (devocionais, eventos,
   * círculos) é reatribuído a quem executou a exclusão para preservar
   * o histórico da igreja.
   */
  @Delete('users/:id')
  async deleteUser(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    if (id === actor.id) {
      throw new ForbiddenException('Você não pode excluir a si mesmo.');
    }
    const target = await this.prisma.user.findFirst({
      where: { id, churchId: actor.churchId },
    });
    if (!target) throw new NotFoundException('Membro não encontrado.');
    if (rank(target.role) >= rank(actor.role)) {
      throw new ForbiddenException(
        'Você não pode excluir alguém do seu nível ou acima na hierarquia.',
      );
    }

    const postIds = (
      await this.prisma.post.findMany({
        where: { authorId: id },
        select: { id: true },
      })
    ).map((p) => p.id);
    const prayerIds = (
      await this.prisma.prayerRequest.findMany({
        where: { userId: id },
        select: { id: true },
      })
    ).map((p) => p.id);

    await this.prisma.$transaction([
      // desfaz vínculos que apontam para o membro
      this.prisma.user.updateMany({
        where: { leaderId: id },
        data: { leaderId: null },
      }),
      this.prisma.user.updateMany({
        where: { duoPartnerId: id },
        data: { duoPartnerId: null },
      }),
      this.prisma.team.updateMany({
        where: { leaderId: id },
        data: { leaderId: null },
      }),
      this.prisma.team.updateMany({
        where: { viceId: id },
        data: { viceId: null },
      }),
      // conteúdo institucional é preservado, reatribuído ao executor
      this.prisma.devotional.updateMany({
        where: { authorId: id },
        data: { authorId: actor.id },
      }),
      this.prisma.event.updateMany({
        where: { creatorId: id },
        data: { creatorId: actor.id },
      }),
      this.prisma.prayerCircle.updateMany({
        where: { leaderId: id },
        data: { leaderId: actor.id },
      }),
      // dados pessoais e de atividade são removidos
      this.prisma.prayerIntercession.deleteMany({
        where: { OR: [{ userId: id }, { requestId: { in: prayerIds } }] },
      }),
      this.prisma.prayerRequest.deleteMany({ where: { userId: id } }),
      this.prisma.reaction.deleteMany({
        where: { OR: [{ userId: id }, { postId: { in: postIds } }] },
      }),
      this.prisma.comment.deleteMany({
        where: { OR: [{ authorId: id }, { postId: { in: postIds } }] },
      }),
      this.prisma.post.deleteMany({ where: { authorId: id } }),
      this.prisma.devotionalCompletion.deleteMany({ where: { userId: id } }),
      this.prisma.missionCompletion.deleteMany({ where: { userId: id } }),
      this.prisma.eventAttendance.deleteMany({ where: { userId: id } }),
      this.prisma.circleAttendance.deleteMany({ where: { userId: id } }),
      this.prisma.userBadge.deleteMany({ where: { userId: id } }),
      this.prisma.growthArea.deleteMany({ where: { userId: id } }),
      this.prisma.xpTransaction.deleteMany({ where: { userId: id } }),
      this.prisma.notification.deleteMany({ where: { userId: id } }),
      this.prisma.journalEntry.deleteMany({ where: { userId: id } }),
      this.prisma.scheduleSlot.deleteMany({ where: { userId: id } }),
      this.prisma.streak.deleteMany({ where: { userId: id } }),
      this.prisma.user.delete({ where: { id } }),
    ]);

    return { ok: true };
  }

  /**
   * Histórico de pontos do membro: cada lançamento com motivo, valor
   * e horário — inclui ganhos por atividade e ajustes da liderança.
   */
  @Get('users/:id/xp-history')
  async xpHistory(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    const target = await this.prisma.user.findFirst({
      where: { id, churchId: actor.churchId },
      select: { id: true, name: true, nickname: true, xpTotal: true },
    });
    if (!target) throw new NotFoundException('Membro não encontrado.');

    const entries = await this.prisma.xpTransaction.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        amount: true,
        reason: true,
        area: true,
        refType: true,
        createdAt: true,
      },
    });
    return { user: target, entries };
  }

  /** Adiciona ou desconta XP de um membro, com motivo registrado. */
  @Post('users/:id/xp')
  async adjustXp(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body() dto: AdjustXpDto,
  ) {
    const target = await this.prisma.user.findFirst({
      where: { id, churchId: actor.churchId },
    });
    if (!target) throw new NotFoundException('Membro não encontrado.');
    return this.gamification.adjustXp(id, dto.amount, dto.reason);
  }

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

  /**
   * Alertas de presença: identifica membros faltando muito nos cultos
   * recorrentes, agrupados por dia da semana (ex.: "culto de domingo",
   * "culto de quinta"). Considera as últimas 6 semanas e só gera alerta
   * para séries com pelo menos 3 cultos realizados.
   */
  @Get('attendance-alerts')
  async attendanceAlerts(@CurrentUser() user: AuthUser) {
    const since = new Date(Date.now() - 42 * 86_400_000); // 6 semanas
    const now = new Date();

    const [events, members] = await Promise.all([
      this.prisma.event.findMany({
        where: {
          churchId: user.churchId,
          type: 'CULTO',
          startsAt: { gte: since, lte: now },
        },
        include: {
          attendances: {
            where: { status: 'CHECKIN' },
            select: { userId: true },
          },
        },
      }),
      this.prisma.user.findMany({
        where: { churchId: user.churchId, role: { not: 'VISITANTE' } },
        select: { id: true, name: true, nickname: true, avatarUrl: true, phone: true },
      }),
    ]);

    const WEEKDAYS = [
      'domingo',
      'segunda',
      'terça',
      'quarta',
      'quinta',
      'sexta',
      'sábado',
    ];

    // agrupa os cultos realizados por dia da semana (horário de Brasília,
    // UTC-3 — um culto de domingo às 21h30 não pode virar "segunda")
    const BRT_OFFSET_MS = 3 * 3_600_000;
    const byWeekday = new Map<number, typeof events>();
    for (const event of events) {
      const day = new Date(event.startsAt.getTime() - BRT_OFFSET_MS).getUTCDay();
      byWeekday.set(day, [...(byWeekday.get(day) ?? []), event]);
    }

    const alerts: Array<{
      user: (typeof members)[number];
      weekday: string;
      total: number;
      attended: number;
      missed: number;
      severity: 'alto' | 'medio';
    }> = [];

    for (const [day, series] of byWeekday) {
      if (series.length < 3) continue; // não é um culto recorrente

      for (const member of members) {
        const attended = series.filter((event) =>
          event.attendances.some((a) => a.userId === member.id),
        ).length;
        const missed = series.length - attended;
        const rate = attended / series.length;

        if (rate <= 0.5) {
          alerts.push({
            user: member,
            weekday: WEEKDAYS[day],
            total: series.length,
            attended,
            missed,
            severity: rate <= 0.25 ? 'alto' : 'medio',
          });
        }
      }
    }

    // mais críticos primeiro
    alerts.sort(
      (a, b) => a.attended / a.total - b.attended / b.total || b.missed - a.missed,
    );
    return alerts.slice(0, 30);
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
