import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MissionsController } from './missions.controller.js';
import { MissionsService } from './missions.service.js';
import {
  JwtAuthGuard,
  type AuthenticatedRequest,
} from '../auth/jwt-auth.guard.js';
import { BureauGuard } from '../auth/bureau.guard.js';

describe('MissionsController', () => {
  let controller: MissionsController;

  const missionsServiceMock = {
    findAllForBureau: vi.fn(),
    findOneForBureau: vi.fn(),
    findMine: vi.fn(),
  };

  function createRequest(
    activeSpace: 'bureau' | 'intervenant',
    isBureau: boolean,
    isIntervenant: boolean,
  ): AuthenticatedRequest {
    return {
      user: {
        id: 1,
        email: 'test@example.com',
        isBureau,
        isIntervenant,
        activeSpace,
      },
    } as AuthenticatedRequest;
  }

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

  it('should allow an Intervenant to access their missions', () => {
    const request = createRequest('intervenant', false, true);
    const missions = [{ id: 1, title: 'Mission test' }];

    missionsServiceMock.findMine.mockReturnValue(missions);

    const result = controller.getMine(request);

    expect(result).toEqual(missions);
    expect(missionsServiceMock.findMine).toHaveBeenCalledWith(1);
  });

  it('should reject a Bureau member accessing Intervenant missions', () => {
    const request = createRequest('bureau', true, false);

    expect(() => controller.getMine(request)).toThrow(
      new ForbiddenException('Accès réservé aux intervenants'),
    );

    expect(missionsServiceMock.findMine).not.toHaveBeenCalled();
  });

  it('should reject a mixed-role user connected as Bureau', () => {
    const request = createRequest('bureau', true, true);

    expect(() => controller.getMine(request)).toThrow(
      new ForbiddenException('Accès réservé aux intervenants'),
    );

    expect(missionsServiceMock.findMine).not.toHaveBeenCalled();
  });
});