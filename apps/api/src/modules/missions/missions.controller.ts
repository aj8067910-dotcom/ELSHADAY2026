import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateMissionDto, UpdateMissionDto } from './dto/missions.dto';
import { MissionsService } from './missions.service';

@ApiTags('missions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('missions')
export class MissionsController {
  constructor(private missions: MissionsService) {}

  @Get('manage')
  @Roles('LIDER')
  manage(@CurrentUser() user: AuthUser) {
    return this.missions.manage(user.churchId);
  }

  @Post()
  @Roles('LIDER')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateMissionDto) {
    return this.missions.createMission(user.churchId, dto);
  }

  @Patch(':id')
  @Roles('LIDER')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateMissionDto,
  ) {
    return this.missions.updateMission(user.churchId, id, dto);
  }

  @Delete(':id')
  @Roles('LIDER')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.missions.deleteMission(user.churchId, id);
  }

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
