import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  NotEquals,
} from 'class-validator';

export class AdminUpdateUserDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nickname?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() birthDate?: string;
  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
  @ApiPropertyOptional() @IsOptional() @IsString() teamId?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() leaderId?: string | null;
  @ApiPropertyOptional({ description: 'Define uma nova senha para o membro' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}

export class AdjustXpDto {
  @ApiProperty({ description: 'Positivo adiciona, negativo desconta' })
  @IsInt()
  @NotEquals(0)
  amount!: number;

  @ApiProperty({ example: 'Reconhecimento por servir no evento' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
