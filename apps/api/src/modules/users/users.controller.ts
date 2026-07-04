import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import {
  AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UsersService } from './users.service';

class UpdateMeDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() nickname?: string;
  @IsOptional() @IsString() bio?: string;
  @IsOptional() @IsString() favoriteVerse?: string;
  @IsOptional() @IsString() avatarUrl?: string;
  @IsOptional() @IsString() bannerUrl?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() city?: string;
}

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.users.me(user.id);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateMeDto) {
    return this.users.updateMe(user.id, dto);
  }

  @Get('birthdays/today')
  birthdays(@CurrentUser() user: AuthUser) {
    return this.users.birthdaysToday(user.churchId);
  }

  @Get(':id/profile')
  profile(@Param('id') id: string) {
    return this.users.profile(id);
  }
}
