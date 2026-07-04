import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PostType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { XP_REWARDS } from '../gamification/levels';

class CreatePostDto {
  @IsEnum(PostType) type!: PostType;
  @IsOptional() @IsString() body?: string;
  @IsOptional() @IsString() mediaUrl?: string;
}

class CommentDto {
  @IsString() @IsNotEmpty() body!: string;
}

class ReactDto {
  @IsOptional() @IsString() emoji?: string;
}

const AUTHOR = {
  select: { id: true, name: true, nickname: true, avatarUrl: true },
} as const;

@ApiTags('feed')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('feed')
export class FeedController {
  constructor(
    private prisma: PrismaService,
    private gamification: GamificationService,
  ) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query('cursor') cursor?: string) {
    return this.prisma.post.findMany({
      where: { churchId: user.churchId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        author: AUTHOR,
        comments: {
          include: { author: AUTHOR },
          orderBy: { createdAt: 'asc' },
          take: 3,
        },
        reactions: true,
        _count: { select: { comments: true, reactions: true } },
      },
    });
  }

  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreatePostDto) {
    const post = await this.prisma.post.create({
      data: {
        churchId: user.churchId,
        authorId: user.id,
        type: dto.type,
        body: dto.body,
        mediaUrl: dto.mediaUrl,
      },
      include: { author: AUTHOR },
    });
    if (dto.type === 'TESTEMUNHO') {
      await this.gamification.grantXp(
        user.id,
        XP_REWARDS.TESTEMUNHO,
        'Testemunho compartilhado no mural',
        { area: 'COMUNHAO', refType: 'post', refId: post.id },
      );
    }
    return post;
  }

  @Post(':id/comments')
  comment(
    @CurrentUser() user: AuthUser,
    @Param('id') postId: string,
    @Body() dto: CommentDto,
  ) {
    return this.prisma.comment.create({
      data: { postId, authorId: user.id, body: dto.body },
      include: { author: AUTHOR },
    });
  }

  @Post(':id/react')
  react(
    @CurrentUser() user: AuthUser,
    @Param('id') postId: string,
    @Body() dto: ReactDto,
  ) {
    return this.prisma.reaction.upsert({
      where: { postId_userId: { postId, userId: user.id } },
      create: { postId, userId: user.id, emoji: dto.emoji ?? '🙌' },
      update: { emoji: dto.emoji ?? '🙌' },
    });
  }
}
