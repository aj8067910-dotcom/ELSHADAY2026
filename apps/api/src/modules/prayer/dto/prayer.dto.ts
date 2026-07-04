import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PrayerVisibility } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePrayerRequestDto {
  @ApiProperty() @IsString() @IsNotEmpty() title!: string;
  @ApiProperty() @IsString() @IsNotEmpty() body!: string;
  @ApiPropertyOptional({ enum: PrayerVisibility })
  @IsOptional()
  @IsEnum(PrayerVisibility)
  visibility?: PrayerVisibility;
  @ApiPropertyOptional({ description: 'Pedido ao vivo durante o culto' })
  @IsOptional()
  @IsBoolean()
  live?: boolean;
}

export class UpdatePrayerRequestDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() body?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() answered?: boolean;
  @ApiPropertyOptional({ description: 'Testemunho quando respondido' })
  @IsOptional()
  @IsString()
  testimony?: string;
}

export class CreateCircleDto {
  @ApiProperty() @IsString() @IsNotEmpty() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() theme?: string;
  @ApiProperty() @IsDateString() date!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() location?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() online?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() materials?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() verses?: string;
}
