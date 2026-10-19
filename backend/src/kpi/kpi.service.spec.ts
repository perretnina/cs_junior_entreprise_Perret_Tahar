
import { Test, TestingModule } from '@nestjs/testing';
import {
  vi,
  describe,
  it,
  expect,
  beforeEach,
} from 'vitest';

import { KpiService } from './kpi.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { Domaine } from '../generated/prisma/enums.js';

describe('KpiService', () => {
  let service: KpiService;

  const prismaMock = {
    mission: {
      findMany: vi.fn<
        (args?: Record<string, unknown>) => Promise<unknown[]>
      >(),
    },
    prospect: {
      findMany: vi.fn<
        (args?: Record<string, unknown>) => Promise<unknown[]>
      >(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          KpiService,
          {
            provide: PrismaService,
            useValue: prismaMock,
          },
        ],
      }).compile();

    service = module.get<KpiService>(KpiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return zero values when there is no data', async () => {
    prismaMock.mission.findMany.mockResolvedValue([]);
    prismaMock.prospect.findMany.mockResolvedValue([]);

    const result = await service.getKpi({});

    expect(result.totalMissions).toBe(0);
    expect(result.signedRevenue).toBe(0);
    expect(result.averageSignedPrice).toBe(0);
    expect(result.averageDurationDays).toBe(0);
    expect(result.distinctIntervenants).toBe(0);
    expect(result.conversionRate).toBe(0);
    expect(result.contactedProspects).toBe(0);
    expect(result.convertedProspects).toBe(0);
  });

  it('should calculate mission statistics correctly', async () => {
    prismaMock.mission.findMany.mockResolvedValue([
      {
        id: 1,
        price: '2000.00',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-11'),
        signedAt: new Date('2025-12-20'),
        prospectId: 1,
        intervenants: [
          { intervenantId: 1 },
          { intervenantId: 2 },
        ],
      },
      {
        id: 2,
        price: '4000.00',
        startDate: new Date('2026-02-01'),
        endDate: new Date('2026-02-21'),
        signedAt: new Date('2026-01-20'),
        prospectId: 2,
        intervenants: [
          { intervenantId: 2 },
        ],
      },
    ]);

    prismaMock.prospect.findMany.mockResolvedValue([
      { id: 1 },
      { id: 2 },
      { id: 3 },
      { id: 4 },
    ]);

    const result = await service.getKpi({});

    expect(result.totalMissions).toBe(2);
    expect(result.signedRevenue).toBe(6000);
    expect(result.averageSignedPrice).toBe(3000);
    expect(result.averageDurationDays).toBe(15);
    expect(result.distinctIntervenants).toBe(2);

    expect(result.contactedProspects).toBe(4);
    expect(result.convertedProspects).toBe(2);
    expect(result.conversionRate).toBe(50);
  });

  it('should exclude unsigned missions from signed revenue', async () => {
    prismaMock.mission.findMany.mockResolvedValue([
      {
        id: 1,
        price: '3000.00',
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-03-11'),
        signedAt: new Date('2026-02-20'),
        prospectId: 1,
        intervenants: [],
      },
      {
        id: 2,
        price: '7000.00',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2026-04-11'),
        signedAt: null,
        prospectId: 2,
        intervenants: [],
      },
    ]);

    prismaMock.prospect.findMany.mockResolvedValue([
      { id: 1 },
      { id: 2 },
    ]);

    const result = await service.getKpi({});

    expect(result.totalMissions).toBe(2);
    expect(result.signedRevenue).toBe(3000);
    expect(result.averageSignedPrice).toBe(3000);
    expect(result.convertedProspects).toBe(1);
    expect(result.conversionRate).toBe(50);
  });

  it('should count each intervenant only once', async () => {
    prismaMock.mission.findMany.mockResolvedValue([
      {
        id: 1,
        price: '1000.00',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-10'),
        signedAt: new Date('2025-12-15'),
        prospectId: 1,
        intervenants: [
          { intervenantId: 1 },
          { intervenantId: 2 },
        ],
      },
      {
        id: 2,
        price: '2000.00',
        startDate: new Date('2026-02-01'),
        endDate: new Date('2026-02-10'),
        signedAt: new Date('2026-01-15'),
        prospectId: 2,
        intervenants: [
          { intervenantId: 1 },
          { intervenantId: 3 },
        ],
      },
    ]);

    prismaMock.prospect.findMany.mockResolvedValue([]);

    const result = await service.getKpi({});

    expect(result.distinctIntervenants).toBe(3);
  });

  it('should pass domain and date filters to Prisma', async () => {
    prismaMock.mission.findMany.mockResolvedValue([]);
    prismaMock.prospect.findMany.mockResolvedValue([]);

    const startDate = new Date('2026-01-01');
    const endDate = new Date('2026-12-31');

    const result = await service.getKpi({
      domain: Domaine.INFORMATIQUE,
      startDate,
      endDate,
    });

    expect(prismaMock.mission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          domain: Domaine.INFORMATIQUE,
          startDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
    );

    expect(prismaMock.prospect.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          domain: Domaine.INFORMATIQUE,
        }),
      }),
    );

    expect(result.filters).toEqual({
      domain: Domaine.INFORMATIQUE,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });
  });
});
