import { Module } from '@nestjs/common';
import { GamificationModule } from '../gamification/gamification.module';
import { PrayerController } from './prayer.controller';
import { PrayerService } from './prayer.service';

@Module({
  imports: [GamificationModule],
  controllers: [PrayerController],
  providers: [PrayerService],
})
export class PrayerModule {}
