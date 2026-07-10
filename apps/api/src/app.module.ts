import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { HealthController } from './health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DevotionalsModule } from './modules/devotionals/devotionals.module';
import { PrayerModule } from './modules/prayer/prayer.module';
import { EventsModule } from './modules/events/events.module';
import { MissionsModule } from './modules/missions/missions.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { TeamsModule } from './modules/teams/teams.module';
import { FeedModule } from './modules/feed/feed.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    DevotionalsModule,
    PrayerModule,
    EventsModule,
    MissionsModule,
    GamificationModule,
    TeamsModule,
    FeedModule,
    NotificationsModule,
    AdminModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
