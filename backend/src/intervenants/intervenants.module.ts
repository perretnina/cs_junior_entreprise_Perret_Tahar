import { Module } from '@nestjs/common';
import { IntervenantsController } from './intervenants.controller.js';
import { IntervenantsService } from './intervenants.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/dto/auth.module.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [IntervenantsController],
  providers: [IntervenantsService],
})
export class IntervenantsModule {}