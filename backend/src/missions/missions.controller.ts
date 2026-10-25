import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MissionsService } from './missions.service.js';
import { CreateMissionDto } from './dto/create-mission.dto.js';
import { UpdateMissionDto } from './dto/update-mission.dto.js';
import * as jwtAuthGuard from '../auth/jwt-auth.guard.js';
import { BureauGuard } from '../auth/bureau.guard.js';

@Controller('missions')
@UseGuards(jwtAuthGuard.JwtAuthGuard)
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  @Get('mine')
  getMine(@Req() request: jwtAuthGuard.AuthenticatedRequest) {
    if (request.user.activeSpace !== 'intervenant') {
      throw new ForbiddenException('Accès réservé aux intervenants');
    }

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

  @Post()
  @UseGuards(BureauGuard)
  create(@Body() dto: CreateMissionDto) {
    return this.missionsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(BureauGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMissionDto,
  ) {
    return this.missionsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(BureauGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.missionsService.remove(id);
  }
}
