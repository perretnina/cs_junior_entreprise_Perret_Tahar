import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ProspectsController } from './prospects.controller.js';
import { ProspectsService } from './prospects.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { BureauGuard } from '../auth/bureau.guard.js';


describe('ProspectsController', () => {
  let controller: ProspectsController;

  const prospectsServiceMock = {
    findAll: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProspectsController],
      providers: [
        {
          provide: ProspectsService,
          useValue: prospectsServiceMock,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: vi.fn(() => true),
      })
      .overrideGuard(BureauGuard)
      .useValue({
        canActivate: vi.fn(() => true),
      })
      .compile();

    controller = module.get<ProspectsController>(
      ProspectsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
