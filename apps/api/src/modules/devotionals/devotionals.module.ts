import { Module } from '@nestjs/common';
import { GamificationModule } from '../gamification/gamification.module';
import { DevotionalsController } from './devotionals.controller';
import { DevotionalsService } from './devotionals.service';

@Module({
  imports: [GamificationModule],
  controllers: [DevotionalsController],
  providers: [DevotionalsService],
})
export class DevotionalsModule {}
