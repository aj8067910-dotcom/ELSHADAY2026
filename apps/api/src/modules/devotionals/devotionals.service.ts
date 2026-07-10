import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { todayBrt } from '../../common/brt';
import { PrismaService } from '../../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { XP_REWARDS } from '../gamification/levels';
import { CompleteDevotionalDto, CreateDevotionalDto } from './dto/devotionals.dto';

@Injectable()
export class DevotionalsService {
  constructor(
    private prisma: PrismaService,
    private gamification: GamificationService,
  ) {}

  /**
   * Publicação manual pela liderança. Regra: precisa ser feita com
   * antecedência — a data deve ser de amanhã em diante, para o
   * devocional aparecer no dia seguinte. O conteúdo publicado pelo
   * líder tem prioridade sobre o banco automático de 365 dias.
   */
  async create(churchId: string, authorId: string, dto: CreateDevotionalDto) {
    const date = new Date(dto.date);
    date.setUTCHours(0, 0, 0, 0);

    // "hoje" segue o calendário de Brasília
    const today = todayBrt();

    if (date.getTime() <= today.getTime()) {
      throw new BadRequestException(
        'Publique com antecedência: escolha uma data a partir de amanhã. O devocional de hoje já está garantido pelo banco automático. 😉',
      );
    }

    try {
      return await this.prisma.devotional.create({
        data: {
          churchId,
          authorId,
          date,
          theme: dto.theme,
          verse: dto.verse,
          verseRef: dto.verseRef,
          body: dto.body,
          imageUrl: dto.imageUrl,
          videoUrl: dto.videoUrl,
          audioUrl: dto.audioUrl,
          question: dto.question,
        },
      });
    } catch (e: any) {
      if (e?.code === 'P2002')
        throw new ConflictException('Já existe um devocional para esta data.');
      throw e;
    }
  }

  /**
   * Exclui um devocional (e as conclusões ligadas a ele). Útil quando um
   * conteúdo errado ocupou o dia — o banco de 365 dias republica na
   * próxima abertura do app.
   */
  async remove(churchId: string, id: string) {
    const devotional = await this.prisma.devotional.findFirst({
      where: { id, churchId },
    });
    if (!devotional) throw new NotFoundException('Devocional não encontrado.');

    await this.prisma.$transaction([
      this.prisma.devotionalCompletion.deleteMany({
        where: { devotionalId: id },
      }),
      this.prisma.devotional.delete({ where: { id } }),
    ]);
    return { ok: true };
  }

  list(churchId: string) {
    return this.prisma.devotional.findMany({
      where: { churchId },
      orderBy: { date: 'desc' },
      take: 30,
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { completions: true } },
      },
    });
  }

  async today(churchId: string, userId: string) {
    // o dia devocional vira à meia-noite de Brasília, não do UTC
    const start = todayBrt();
    const end = new Date(start.getTime() + 86_400_000);

    let devotional = await this.prisma.devotional.findFirst({
      where: { churchId, date: { gte: start, lt: end } },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        completions: { where: { userId } },
        _count: { select: { completions: true } },
      },
    });

    // Ninguém publicou até ontem? O banco de 365 dias assume.
    if (!devotional) {
      await this.publishFromBank(churchId, start);
      devotional = await this.prisma.devotional.findFirst({
        where: { churchId, date: { gte: start, lt: end } },
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
          completions: { where: { userId } },
          _count: { select: { completions: true } },
        },
      });
    }
    if (!devotional) return null;

    const { completions, ...rest } = devotional;
    return { ...rest, completedByMe: completions.length > 0 };
  }

  /**
   * Publica automaticamente a entrada do dia a partir do banco anual.
   * `date` já é o dia do calendário brasileiro (meia-noite em UTC).
   */
  private async publishFromBank(churchId: string, date: Date) {
    const startOfYear = Date.UTC(date.getUTCFullYear(), 0, 1);
    let dayOfYear =
      Math.floor((date.getTime() - startOfYear) / 86_400_000) + 1;
    if (dayOfYear > 365) dayOfYear = 365; // 31/12 em ano bissexto reaproveita o dia 365

    const entry = await this.prisma.devotionalBankEntry.findUnique({
      where: { dayIndex: dayOfYear },
    });
    if (!entry) return; // banco não semeado — segue sem devocional

    // autor "institucional": primeiro líder disponível da igreja
    const author = await this.prisma.user.findFirst({
      where: { churchId, role: { in: ['ADMIN', 'PASTOR', 'LIDER'] } },
      orderBy: { createdAt: 'asc' },
    });
    const fallback =
      author ??
      (await this.prisma.user.findFirst({
        where: { churchId },
        orderBy: { createdAt: 'asc' },
      }));
    if (!fallback) return;

    try {
      await this.prisma.devotional.create({
        data: {
          churchId,
          authorId: fallback.id,
          date,
          theme: entry.theme,
          verse: entry.verse,
          verseRef: entry.verseRef,
          body: entry.body,
          question: entry.question,
        },
      });
    } catch (e: any) {
      // corrida entre duas requisições simultâneas: outra já publicou
      if (e?.code !== 'P2002') throw e;
    }
  }

  /** "Hoje fiz meu devocional" — XP + streak em uma ação. */
  async complete(userId: string, devotionalId: string, dto: CompleteDevotionalDto) {
    const devotional = await this.prisma.devotional.findUnique({
      where: { id: devotionalId },
    });
    if (!devotional) throw new NotFoundException('Devocional não encontrado.');

    const already = await this.prisma.devotionalCompletion.findUnique({
      where: { devotionalId_userId: { devotionalId, userId } },
    });
    if (already) throw new ConflictException('Devocional já concluído hoje. 🙌');

    await this.prisma.devotionalCompletion.create({
      data: {
        devotionalId,
        userId,
        note: dto.note,
        favorite: dto.favorite ?? false,
      },
    });

    const streak = await this.gamification.touchStreak(userId);
    const xp = await this.gamification.grantXp(
      userId,
      XP_REWARDS.DEVOCIONAL,
      'Devocional concluído',
      { area: 'PALAVRA', refType: 'devotional', refId: devotionalId },
    );

    if (streak.current === 30) {
      await this.gamification.grantBadge(userId, 'devocional-30');
    }

    return { xp, streak: { current: streak.current, longest: streak.longest } };
  }

  favorites(userId: string) {
    return this.prisma.devotionalCompletion.findMany({
      where: { userId, favorite: true },
      include: { devotional: true },
      orderBy: { completedAt: 'desc' },
    });
  }
}
