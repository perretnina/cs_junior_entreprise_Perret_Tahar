import { Module } from '@nestjs/common';
import { IntervenantsController } from './intervenants.controller.js';
import { IntervenantsService } from './intervenants.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [IntervenantsController],
  providers: [IntervenantsService],
})
export class IntervenantsModule {}