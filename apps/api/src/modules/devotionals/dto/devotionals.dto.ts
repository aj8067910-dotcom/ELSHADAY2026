import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateDevotionalDto {
  @ApiProperty() @IsDateString() date!: string;
  @ApiProperty() @IsString() @IsNotEmpty() theme!: string;
  @ApiProperty() @IsString() @IsNotEmpty() verse!: string;
  @ApiProperty({ example: 'Salmos 23:1' }) @IsString() verseRef!: string;
  @ApiProperty() @IsString() @IsNotEmpty() body!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() imageUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() videoUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() audioUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() question?: string;
}

export class CompleteDevotionalDto {
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() favorite?: boolean;
}
