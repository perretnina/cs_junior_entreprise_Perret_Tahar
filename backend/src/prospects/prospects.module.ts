import { Module } from '@nestjs/common';
import { ProspectsController } from './prospects.controller.js';
import { ProspectsService } from './prospects.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ProspectsController],
  providers: [ProspectsService],
})
export class ProspectsModule {}
