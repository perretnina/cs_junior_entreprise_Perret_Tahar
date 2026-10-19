import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { IntervenantsService } from './intervenants.service.js';
import { CreateIntervenantDto } from './dto/create-intervenant.dto.js';
import { UpdateIntervenantDto } from './dto/update-intervenant.dto.js';

@Controller('intervenants')
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