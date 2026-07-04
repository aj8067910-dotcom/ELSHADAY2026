import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

  create(churchId: string, authorId: string, dto: CreateDevotionalDto) {
    return this.prisma.devotional.create({
      data: {
        churchId,
        authorId,
        date: new Date(dto.date),
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
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const devotional = await this.prisma.devotional.findFirst({
      where: { churchId, date: { gte: start, lt: end } },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        completions: { where: { userId } },
        _count: { select: { completions: true } },
      },
    });
    if (!devotional) return null;

    const { completions, ...rest } = devotional;
    return { ...rest, completedByMe: completions.length > 0 };
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
