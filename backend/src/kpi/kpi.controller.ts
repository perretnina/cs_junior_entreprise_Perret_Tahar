
import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { KpiService } from './kpi.service.js';
import { Domaine } from '../generated/prisma/enums.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { BureauGuard } from '../auth/bureau.guard.js';

@Controller('kpi')
@UseGuards(JwtAuthGuard, BureauGuard)
export class KpiController {
  constructor(private readonly kpiService: KpiService) {}

  @Get()
  getKpi(
    @Query('domain') domain?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (
      domain !== undefined &&
      !Object.values(Domaine).includes(domain as Domaine)
    ) {
      throw new BadRequestException('Domaine invalide');
    }

    const parseDate = (value: string | undefined) => {
      if (value === undefined) return undefined;

      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new BadRequestException(
          'Les dates doivent être au format YYYY-MM-DD',
        );
      }

      const date = new Date(`${value}T00:00:00.000Z`);

      if (
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== value
      ) {
        throw new BadRequestException('Date invalide');
      }

      return date;
    };

    const start = parseDate(startDate);
    const end = parseDate(endDate);

    if (start && end && start > end) {
      throw new BadRequestException(
        'startDate doit être antérieure ou égale à endDate',
      );
    }

    return this.kpiService.getKpi({
      domain: domain as Domaine | undefined,
      startDate: start,
      endDate: end,
    });
  }
}
