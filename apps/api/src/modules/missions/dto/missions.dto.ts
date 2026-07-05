import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { GrowthAreaKey, MissionFrequency } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateMissionDto {
  @ApiProperty() @IsString() @IsNotEmpty() title!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() icon?: string;
  @ApiProperty({ example: 20 })
  @IsInt()
  @Min(1)
  @Max(500)
  xpReward!: number;
  @ApiProperty({ enum: MissionFrequency })
  @IsEnum(MissionFrequency)
  frequency!: MissionFrequency;
  @ApiProperty({ enum: GrowthAreaKey })
  @IsEnum(GrowthAreaKey)
  area!: GrowthAreaKey;
}

export class UpdateMissionDto extends PartialType(CreateMissionDto) {
  @ApiPropertyOptional({ description: 'Desativa sem excluir o histórico' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
