
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
import { ProspectsService } from './prospects.service.js';
import { CreateProspectDto } from './dto/create-prospect.dto.js';
import { UpdateProspectDto } from './dto/update-prospect.dto.js';
import { JwtAuthGuard } from '../auth/dto/jwt-auth.guard.js';
import { BureauGuard } from '../auth/dto/bureau.guard.js';

@Controller('prospects')
@UseGuards(JwtAuthGuard, BureauGuard)
export class ProspectsController {
  constructor(private readonly prospectsService: ProspectsService) {}

  @Get()
  findAll() {
    return this.prospectsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.prospectsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateProspectDto) {
    return this.prospectsService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProspectDto,
  ) {
    return this.prospectsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.prospectsService.remove(id);
  }
}
