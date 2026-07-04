import {
  Body,
  Controller,
  Get,
  Param,
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
  CompleteDevotionalDto,
  CreateDevotionalDto,
} from './dto/devotionals.dto';
import { DevotionalsService } from './devotionals.service';

@ApiTags('devotionals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('devotionals')
export class DevotionalsController {
  constructor(private devotionals: DevotionalsService) {}

  @Post()
  @Roles('LIDER')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateDevotionalDto) {
    return this.devotionals.create(user.churchId, user.id, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.devotionals.list(user.churchId);
  }

  @Get('today')
  today(@CurrentUser() user: AuthUser) {
    return this.devotionals.today(user.churchId, user.id);
  }

  @Get('favorites')
  favorites(@CurrentUser() user: AuthUser) {
    return this.devotionals.favorites(user.id);
  }

  @Post(':id/complete')
  complete(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CompleteDevotionalDto,
  ) {
    return this.devotionals.complete(user.id, id, dto);
  }
}
