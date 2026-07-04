import {
  Body,
  Controller,
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
import {
  CreateCircleDto,
  CreatePrayerRequestDto,
  UpdatePrayerRequestDto,
} from './dto/prayer.dto';
import { PrayerService } from './prayer.service';

@ApiTags('prayer')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('prayer')
export class PrayerController {
  constructor(private prayer: PrayerService) {}

  @Post('requests')
  createRequest(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreatePrayerRequestDto,
  ) {
    return this.prayer.createRequest(user.churchId, user.id, dto);
  }

  @Get('requests')
  list(@CurrentUser() user: AuthUser) {
    return this.prayer.list(user.churchId, user.id, user.role);
  }

  @Patch('requests/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdatePrayerRequestDto,
  ) {
    return this.prayer.update(user.id, id, dto);
  }

  @Post('requests/:id/intercede')
  intercede(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.prayer.intercede(user.id, id);
  }

  @Post('circles')
  @Roles('VICE_LIDER')
  createCircle(@CurrentUser() user: AuthUser, @Body() dto: CreateCircleDto) {
    return this.prayer.createCircle(user.churchId, user.id, dto);
  }

  @Get('circles')
  listCircles(@CurrentUser() user: AuthUser) {
    return this.prayer.listCircles(user.churchId);
  }

  @Post('circles/:id/attend')
  attend(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.prayer.attendCircle(user.id, id);
  }
}
