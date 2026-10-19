import { Module } from '@nestjs/common';
import { KpiController } from './kpi.controller.js';
import { KpiService } from './kpi.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/dto/auth.module.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [KpiController],
  providers: [KpiService],
})
export class KpiModule {}
