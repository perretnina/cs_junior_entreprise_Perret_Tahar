
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';

import { KpiController } from './kpi.controller.js';
import { KpiService } from './kpi.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { BureauGuard } from '../auth/bureau.guard.js';

describe('KpiController', () => {
  let controller: KpiController;

  const kpiServiceMock = {
    getKpi: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [KpiController],
      providers: [
        {
          provide: KpiService,
          useValue: kpiServiceMock,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: vi.fn(() => true) })
      .overrideGuard(BureauGuard)
      .useValue({ canActivate: vi.fn(() => true) })
      .compile();

    controller = module.get<KpiController>(KpiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
