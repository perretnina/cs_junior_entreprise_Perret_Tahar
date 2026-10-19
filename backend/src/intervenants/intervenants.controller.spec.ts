
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';

import { IntervenantsController } from './intervenants.controller.js';
import { IntervenantsService } from './intervenants.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { BureauGuard } from '../auth/bureau.guard.js';

describe('IntervenantsController', () => {
  let controller: IntervenantsController;

  const intervenantsServiceMock = {
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [IntervenantsController],
      providers: [
        {
          provide: IntervenantsService,
          useValue: intervenantsServiceMock,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: vi.fn(() => true) })
      .overrideGuard(BureauGuard)
      .useValue({ canActivate: vi.fn(() => true) })
      .compile();

    controller = module.get<IntervenantsController>(
      IntervenantsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
