import { Module } from '@nestjs/common';
import { GamificationModule } from '../gamification/gamification.module';
import { MissionsController } from './missions.controller';
import { MissionsService } from './missions.service';

@Module({
  imports: [GamificationModule],
  controllers: [MissionsController],
  providers: [MissionsService],
})
export class MissionsModule {}
