import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { IntervenantsModule } from './intervenants/intervenants.module.js';
import { AuthModule } from './auth/dto/auth.module.js';
import { MissionsModule } from './missions/missions.module.js';
import { ProspectsModule } from './prospects/prospects.module.js';
import { KpiModule } from './kpi/kpi.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    IntervenantsModule,
    AuthModule,
    MissionsModule,
    ProspectsModule,
    KpiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}