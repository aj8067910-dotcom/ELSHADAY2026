import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MissionsService } from './missions.service';

@ApiTags('missions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('missions')
export class MissionsController {
  constructor(private missions: MissionsService) {}

  @Get('daily')
  daily(@CurrentUser() user: AuthUser) {
    return this.missions.daily(user.churchId, user.id);
  }

  @Get('weekly-challenge')
  weekly(@CurrentUser() user: AuthUser) {
    return this.missions.weeklyChallenge(user.churchId, user.id);
  }

  @Post(':id/complete')
  complete(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.missions.complete(user.id, id);
  }
}
