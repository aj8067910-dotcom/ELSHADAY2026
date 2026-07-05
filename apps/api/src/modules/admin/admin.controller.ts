import {
  Body,
  ConflictException,
  Controller,
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
