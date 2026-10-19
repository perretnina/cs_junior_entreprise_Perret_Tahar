import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { IntervenantsModule } from './intervenants/intervenants.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    IntervenantsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}