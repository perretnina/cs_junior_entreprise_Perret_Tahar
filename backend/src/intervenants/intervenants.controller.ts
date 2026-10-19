import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IntervenantsService } from './intervenants.service.js';
import { CreateIntervenantDto } from './dto/create-intervenant.dto.js';
import { UpdateIntervenantDto } from './dto/update-intervenant.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { BureauGuard } from '../auth/bureau.guard.js';

@Controller('intervenants')
@UseGuards(JwtAuthGuard, BureauGuard)
export class IntervenantsController {
  constructor(
    private readonly intervenantsService: IntervenantsService,
  ) {}

  @Get()
  findAll() {
    return this.intervenantsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateIntervenantDto) {
    return this.intervenantsService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIntervenantDto,
  ) {
    return this.intervenantsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.intervenantsService.remove(id);
  }
}