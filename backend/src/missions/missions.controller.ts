
import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MissionsService } from './missions.service.js';
import * as jwtAuthGuard from '../auth/jwt-auth.guard.js';
import { BureauGuard } from '../auth/bureau.guard.js';

@Controller('missions')
@UseGuards(jwtAuthGuard.JwtAuthGuard)
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  @Get('mine')
  getMine(@Req() request: jwtAuthGuard.AuthenticatedRequest) {
    return this.missionsService.findMine(request.user.id);
  }

  @Get()
  @UseGuards(BureauGuard)
  findAll() {
    return this.missionsService.findAllForBureau();
  }

  @Get(':id')
  @UseGuards(BureauGuard)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.missionsService.findOneForBureau(id);
  }
}
