
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { MissionsController } from './missions.controller.js';
import { MissionsService } from './missions.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { BureauGuard } from '../auth/bureau.guard.js';

describe('MissionsController', () => {
  let controller: MissionsController;

  const missionsServiceMock = {
    findAllForBureau: vi.fn(),
    findOneForBureau: vi.fn(),
    findMine: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MissionsController],
      providers: [
        {
          provide: MissionsService,
          useValue: missionsServiceMock,
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

    controller = module.get<MissionsController>(
      MissionsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
