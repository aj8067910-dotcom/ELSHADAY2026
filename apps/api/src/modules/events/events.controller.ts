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
import { CheckinDto, CreateEventDto } from './dto/events.dto';
import { EventsService } from './events.service';

@ApiTags('events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('events')
export class EventsController {
  constructor(private events: EventsService) {}

  @Post()
  @Roles('VICE_LIDER')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateEventDto) {
    return this.events.create(user.churchId, user.id, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.events.list(user.churchId, user.id);
  }

  @Post('checkin')
  checkin(@CurrentUser() user: AuthUser, @Body() dto: CheckinDto) {
    return this.events.checkin(user.id, dto);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.events.get(id, user.id, user.role);
  }

  @Post(':id/confirm')
  confirm(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.events.confirm(user.id, id);
  }
}
