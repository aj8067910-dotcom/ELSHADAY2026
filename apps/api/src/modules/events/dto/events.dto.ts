import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateEventDto {
  @ApiProperty({ enum: EventType }) @IsEnum(EventType) type!: EventType;
  @ApiProperty() @IsString() @IsNotEmpty() title!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() bannerUrl?: string;
  @ApiProperty() @IsDateString() startsAt!: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endsAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() location?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() lat?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() lng?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) xpReward?: number;
}

export class CheckinDto {
  @ApiProperty({ description: 'Código lido do QR Code do evento' })
  @IsString()
  @IsNotEmpty()
  code!: string;
}
