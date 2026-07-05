import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { EventType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
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

  @ApiPropertyOptional({
    description:
      'Recorrência semanal: repete o evento por N semanas seguintes (ex.: 12 = toda semana, no mesmo dia e horário, por 12 semanas). Cada ocorrência tem seu próprio QR de check-in.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(52)
  repeatWeeklyCount?: number;
}

export class UpdateEventDto extends PartialType(CreateEventDto) {}

export class CheckinDto {
  @ApiProperty({ description: 'Código lido do QR Code do evento' })
  @IsString()
  @IsNotEmpty()
  code!: string;
}
