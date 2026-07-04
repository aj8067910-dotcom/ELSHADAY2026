import { Module } from '@nestjs/common';
import { GamificationModule } from '../gamification/gamification.module';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [GamificationModule],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
