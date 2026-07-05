import { Injectable, Logger } from '@nestjs/common';
import { GrowthAreaKey } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { levelFromXp } from './levels';

const STREAK_GRACE_HOURS = 48; // perde a sequência apenas após 48h sem atividade

export interface GrantXpResult {
  amount: number;
  xpTotal: number;
  leveledUp: boolean;
  level: number;
  levelTitle: string;
}

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Concede XP a um usuário, atualiza a árvore de crescimento espiritual
   * e o XP coletivo da equipe. Retorna se houve level-up (para o front
   * disparar confetes e animações).
   */
  async grantXp(
    userId: string,
    amount: number,
    reason: string,
    opts: { area?: GrowthAreaKey; refType?: string; refId?: string } = {},
  ): Promise<GrantXpResult> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    const before = levelFromXp(user.xpTotal);

    const [updated] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { xpTotal: { increment: amount } },
      }),
      this.prisma.xpTransaction.create({
        data: {
          userId,
          amount,
          reason,
          area: opts.area,
          refType: opts.refType,
          refId: opts.refId,
        },
      }),
      ...(opts.area
        ? [
            this.prisma.growthArea.upsert({
              where: { userId_area: { userId, area: opts.area } },
              create: { userId, area: opts.area, xp: amount },
              update: { xp: { increment: amount } },
            }),
          ]
        : []),
      ...(user.teamId
        ? [
            this.prisma.team.update({
              where: { id: user.teamId },
              data: { xpTotal: { increment: amount } },
            }),
          ]
        : []),
    ]);

    const after = levelFromXp(updated.xpTotal);
    const leveledUp = after.level > before.level;

    if (leveledUp) {
      await this.notify(
        userId,
        `Você alcançou o nível ${after.level} — ${after.title}! 🎉`,
        'parabens',
      );
    }

    return {
      amount,
      xpTotal: updated.xpTotal,
      leveledUp,
      level: after.level,
      levelTitle: after.title,
    };
  }

  /**
   * Ajuste manual de XP pela liderança (positivo ou negativo).
   * Nunca deixa o total ficar abaixo de zero e registra o motivo
   * no histórico e em uma notificação para o membro.
   */
  async adjustXp(userId: string, amount: number, reason: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    const delta = Math.max(amount, -user.xpTotal);
    if (delta === 0) {
      return { amount: 0, xpTotal: user.xpTotal, ...levelFromXp(user.xpTotal) };
    }

    const ops: any[] = [
      this.prisma.user.update({
        where: { id: userId },
        data: { xpTotal: { increment: delta } },
      }),
      this.prisma.xpTransaction.create({
        data: { userId, amount: delta, reason, refType: 'ajuste' },
      }),
    ];
    if (user.teamId) {
      const team = await this.prisma.team.findUnique({
        where: { id: user.teamId },
      });
      if (team) {
        ops.push(
          this.prisma.team.update({
            where: { id: team.id },
            data: { xpTotal: Math.max(0, team.xpTotal + delta) },
          }),
        );
      }
    }
    const [updated] = await this.prisma.$transaction(ops);

    await this.notify(
      userId,
      delta > 0
        ? `Você recebeu +${delta} XP: ${reason} ✨`
        : `Ajuste de ${delta} XP: ${reason}`,
      'sistema',
    );

    return {
      amount: delta,
      xpTotal: updated.xpTotal,
      level: levelFromXp(updated.xpTotal),
    };
  }

  /**
   * Registra atividade devocional/espiritual do dia e atualiza o streak.
   * A sequência só é perdida após 48h sem atividade.
   */
  async touchStreak(userId: string) {
    const streak = await this.prisma.streak.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    const now = new Date();
    const last = streak.lastActivity;

    let current = streak.current;
    if (!last) {
      current = 1;
    } else {
      const sameDay = last.toDateString() === now.toDateString();
      if (sameDay) {
        // já contou hoje
        return this.prisma.streak.update({
          where: { userId },
          data: { lastActivity: now },
        });
      }
      const hours = (now.getTime() - last.getTime()) / 3_600_000;
      current = hours <= STREAK_GRACE_HOURS ? current + 1 : 1;
    }

    const updated = await this.prisma.streak.update({
      where: { userId },
      data: {
        current,
        longest: Math.max(current, streak.longest),
        lastActivity: now,
      },
    });

    // marcos de streak viram badges
    const milestones: Record<number, string> = {
      5: 'streak-5',
      10: 'streak-10',
      30: 'streak-30',
      100: 'streak-100',
      365: 'streak-365',
    };
    const code = milestones[updated.current];
    if (code) await this.grantBadge(userId, code);

    return updated;
  }

  /** Concede uma badge (idempotente) e notifica o usuário. */
  async grantBadge(userId: string, code: string) {
    const badge = await this.prisma.badge.findUnique({ where: { code } });
    if (!badge) {
      this.logger.warn(`Badge "${code}" não existe — rode as seeds.`);
      return null;
    }
    const existing = await this.prisma.userBadge.findUnique({
      where: { badgeId_userId: { badgeId: badge.id, userId } },
    });
    if (existing) return null;

    const earned = await this.prisma.userBadge.create({
      data: { badgeId: badge.id, userId },
      include: { badge: true },
    });
    await this.notify(
      userId,
      `Nova conquista desbloqueada: ${badge.name} 🏅`,
      'badge',
    );
    return earned;
  }

  /** Resumo de gamificação usado pela Home. */
  async summary(userId: string) {
    const [user, streak, badges, areas] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: userId } }),
      this.prisma.streak.findUnique({ where: { userId } }),
      this.prisma.userBadge.findMany({
        where: { userId },
        include: { badge: true },
        orderBy: { earnedAt: 'desc' },
      }),
      this.prisma.growthArea.findMany({ where: { userId } }),
    ]);

    return {
      xpTotal: user.xpTotal,
      level: levelFromXp(user.xpTotal),
      streak: { current: streak?.current ?? 0, longest: streak?.longest ?? 0 },
      badges: badges.map((ub) => ({
        code: ub.badge.code,
        name: ub.badge.name,
        icon: ub.badge.icon,
        earnedAt: ub.earnedAt,
      })),
      growthTree: areas.map((a) => ({ area: a.area, xp: a.xp })),
    };
  }

  private async notify(userId: string, title: string, kind: string) {
    await this.prisma.notification.create({ data: { userId, title, kind } });
  }
}
