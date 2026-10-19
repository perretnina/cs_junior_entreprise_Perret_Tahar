
import { Module } from '@nestjs/common';
import { MissionsController } from './missions.controller.js';
import { MissionsService } from './missions.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/dto/auth.module.js';
@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [MissionsController],
  providers: [MissionsService],
})
export class MissionsModule {}
