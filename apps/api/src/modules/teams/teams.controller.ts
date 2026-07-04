import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PrismaService } from '../../prisma/prisma.service';

class CreateTeamDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsOptional() @IsString() color?: string;
  @IsOptional() @IsString() photoUrl?: string;
  @IsOptional() @IsString() leaderId?: string;
  @IsOptional() @IsString() viceId?: string;
}

@ApiTags('teams')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('teams')
export class TeamsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.prisma.team.findMany({
      where: { churchId: user.churchId },
      orderBy: { xpTotal: 'desc' },
      include: {
        leader: { select: { id: true, name: true, avatarUrl: true } },
        vice: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { members: true } },
      },
    });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.prisma.team.findUnique({
      where: { id },
      include: {
        leader: { select: { id: true, name: true, avatarUrl: true } },
        vice: { select: { id: true, name: true, avatarUrl: true } },
        members: {
          select: {
            id: true,
            name: true,
            nickname: true,
            avatarUrl: true,
            xpTotal: true,
          },
          orderBy: { xpTotal: 'desc' },
        },
      },
    });
  }

  @Post()
  @Roles('PASTOR')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTeamDto) {
    return this.prisma.team.create({
      data: { churchId: user.churchId, ...dto },
    });
  }
}
