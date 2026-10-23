
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { MissionsService } from './missions.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('MissionsService', () => {
  let service: MissionsService;

  const prismaMock = {
    mission: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    intervenant: {
      findUnique: vi.fn(),
    },
  };

  const missionDetails = {
    id: 1,
    title: 'Développement application web',
    price: '5000.00',
    startDate: new Date('2026-04-01'),
    endDate: new Date('2026-06-30'),
    signedAt: new Date('2026-03-15'),
    status: 'EN_COURS',
    domain: 'INFORMATIQUE',
    prospect: {
      id: 10,
      name: 'Entreprise ABC',
    },
    intervenants: [
      {
        intervenant: {
          id: 5,
          firstName: 'Alice',
          lastName: 'Martin',
        },
      },
    ],
  };

  const intervenant = {
    id: 5,
    userId: 2,
    firstName: 'Alice',
    lastName: 'Martin',
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          MissionsService,
          {
            provide: PrismaService,
            useValue: prismaMock,
          },
        ],
      }).compile();

    service = module.get<MissionsService>(MissionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllForBureau', () => {
    it('should return all missions', async () => {
      prismaMock.mission.findMany.mockResolvedValue([
        missionDetails,
      ]);

      const result = await service.findAllForBureau();

      expect(result).toEqual([missionDetails]);
    });

    it('should order missions by start date descending', async () => {
      prismaMock.mission.findMany.mockResolvedValue([]);

      await service.findAllForBureau();

      expect(prismaMock.mission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            startDate: 'desc',
          },
        }),
      );
    });

    it('should include prices and detailed relations for Bureau', async () => {
      prismaMock.mission.findMany.mockResolvedValue([
        missionDetails,
      ]);

      const result = await service.findAllForBureau();

      expect(result[0].price).toBe('5000.00');

      expect(prismaMock.mission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            price: true,
            prospect: {
              select: {
                id: true,
                name: true,
              },
            },
            intervenants: {
              select: {
                intervenant: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          }),
        }),
      );
    });

    it('should return an empty array when there are no missions', async () => {
      prismaMock.mission.findMany.mockResolvedValue([]);

      const result = await service.findAllForBureau();

      expect(result).toEqual([]);
    });
  });

  describe('findOneForBureau', () => {
    it('should return a mission by its ID', async () => {
      prismaMock.mission.findUnique.mockResolvedValue(
        missionDetails,
      );

      const result = await service.findOneForBureau(1);

      expect(result).toEqual(missionDetails);

      expect(prismaMock.mission.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 1,
          },
        }),
      );
    });

    it('should throw NotFoundException for an unknown mission', async () => {
      prismaMock.mission.findUnique.mockResolvedValue(null);

      await expect(
        service.findOneForBureau(999),
      ).rejects.toThrow(
        new NotFoundException('Mission introuvable'),
      );
    });
  });

  describe('findMine', () => {
    it('should return an empty array when the user is not linked to an intervenant', async () => {
      prismaMock.intervenant.findUnique.mockResolvedValue(null);

      const result = await service.findMine(999);

      expect(result).toEqual([]);

      expect(prismaMock.intervenant.findUnique).toHaveBeenCalledWith({
        where: {
          userId: 999,
        },
      });

      expect(prismaMock.mission.findMany).not.toHaveBeenCalled();
    });

    it('should return missions assigned to the current intervenant', async () => {
      prismaMock.intervenant.findUnique.mockResolvedValue(
        intervenant,
      );

      const assignedMission = {
        id: 1,
        title: 'Développement application web',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2026-06-30'),
        status: 'EN_COURS',
        domain: 'INFORMATIQUE',
      };

      prismaMock.mission.findMany.mockResolvedValue([
        assignedMission,
      ]);

      const result = await service.findMine(2);

      expect(result).toEqual([assignedMission]);

      expect(prismaMock.mission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            intervenants: {
              some: {
                intervenantId: 5,
              },
            },
          },
        }),
      );
    });

    it('should not select mission prices for intervenants', async () => {
      prismaMock.intervenant.findUnique.mockResolvedValue(
        intervenant,
      );

      prismaMock.mission.findMany.mockResolvedValue([]);

      await service.findMine(2);

      expect(prismaMock.mission.findMany).toHaveBeenCalledWith({
        where: {
          intervenants: {
            some: {
              intervenantId: 5,
            },
          },
        },
        select: {
          id: true,
          title: true,
          startDate: true,
          endDate: true,
          status: true,
          domain: true,
          prospect: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          startDate: 'desc',
        },
      });

      const query = prismaMock.mission.findMany.mock.calls[0][0];

      expect(query.select).not.toHaveProperty('price');
      expect(query.select).not.toHaveProperty('signedAt');
    });
  });
});
