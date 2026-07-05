import { Module } from '@nestjs/common';
import { GamificationModule } from '../gamification/gamification.module';
import { AdminController } from './admin.controller';

@Module({ imports: [GamificationModule], controllers: [AdminController] })
export class AdminModule {}
