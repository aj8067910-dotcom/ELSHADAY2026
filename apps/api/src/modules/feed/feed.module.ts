import { Module } from '@nestjs/common';
import { GamificationModule } from '../gamification/gamification.module';
import { FeedController } from './feed.controller';

@Module({ imports: [GamificationModule], controllers: [FeedController] })
export class FeedModule {}
