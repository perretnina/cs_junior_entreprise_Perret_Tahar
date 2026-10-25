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
import { Domaine, StatutMission } from '../generated/prisma/enums.js';

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

  const mission = (
    id: number,
    prospectId: number,
    price: string,
    startDate: string,
    endDate: string,
    intervenantIds: number[] = [],
  ) => ({
    id,
    prospectId,
    price,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    intervenants: intervenantIds.map((intervenantId) => ({
      intervenantId,
    })),
  });

  const signedMission = (
    id: number,
    prospectId: number,
    price: string,
    signedAt: string,
  ) => ({
    id,
    prospectId,
    price,
    signedAt: new Date(signedAt),
  });

  const mockQueries = (
    operationalMissions: unknown[] = [],
    signedMissions: unknown[] = [],
    contactedProspects: unknown[] = [],
    convertedMissions: unknown[] = [],
  ) => {
    prismaMock.mission.findMany
      .mockResolvedValueOnce(operationalMissions)
      .mockResolvedValueOnce(signedMissions)
      .mockResolvedValueOnce(convertedMissions);

    prismaMock.prospect.findMany.mockResolvedValueOnce(
      contactedProspects,
    );
  };

  beforeEach(async () => {
    vi.resetAllMocks();

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
    mockQueries();

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
    mockQueries(
      [
        mission(
          1,
          1,
          '2000.00',
          '2026-01-01',
          '2026-01-11',
          [1, 2],
        ),
        mission(
          2,
          2,
          '4000.00',
          '2026-02-01',
          '2026-02-21',
          [2],
        ),
      ],
      [
        signedMission(1, 1, '2000.00', '2025-12-20'),
        signedMission(2, 2, '4000.00', '2026-01-20'),
      ],
      [
        { id: 1 },
        { id: 2 },
        { id: 3 },
        { id: 4 },
      ],
      [
        { prospectId: 1 },
        { prospectId: 2 },
      ],
    );

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
    mockQueries(
      [
        mission(
          1,
          1,
          '3000.00',
          '2026-03-01',
          '2026-03-11',
        ),
        mission(
          2,
          2,
          '7000.00',
          '2026-04-01',
          '2026-04-11',
        ),
      ],
      [
        signedMission(1, 1, '3000.00', '2026-02-20'),
      ],
      [
        { id: 1 },
        { id: 2 },
      ],
      [
        { prospectId: 1 },
      ],
    );

    const result = await service.getKpi({});

    expect(result.totalMissions).toBe(2);
    expect(result.signedRevenue).toBe(3000);
    expect(result.averageSignedPrice).toBe(3000);
    expect(result.convertedProspects).toBe(1);
    expect(result.conversionRate).toBe(50);
  });

  it('should count each intervenant only once', async () => {
    mockQueries(
      [
        mission(
          1,
          1,
          '1000.00',
          '2026-01-01',
          '2026-01-10',
          [1, 2],
        ),
        mission(
          2,
          2,
          '2000.00',
          '2026-02-01',
          '2026-02-10',
          [1, 3],
        ),
      ],
    );

    const result = await service.getKpi({});

    expect(result.distinctIntervenants).toBe(3);
  });

  it('should calculate the global conversion rate', async () => {
    mockQueries(
      [],
      [],
      [
        { id: 1 },
        { id: 2 },
        { id: 3 },
        { id: 4 },
        { id: 5 },
      ],
      [
        { prospectId: 1 },
        { prospectId: 3 },
      ],
    );

    const result = await service.getKpi({});

    expect(result.contactedProspects).toBe(5);
    expect(result.convertedProspects).toBe(2);
    expect(result.conversionRate).toBe(40);
  });

  it('should count a converted prospect only once', async () => {
    mockQueries(
      [],
      [],
      [
        { id: 1 },
        { id: 2 },
        { id: 3 },
      ],
      [
        { prospectId: 1 },
        { prospectId: 1 },
        { prospectId: 2 },
      ],
    );

    const result = await service.getKpi({});

    expect(result.contactedProspects).toBe(3);
    expect(result.convertedProspects).toBe(2);
    expect(result.conversionRate).toBe(66.67);
  });

  it('should calculate conversion using the first contact year', async () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-12-31');

    mockQueries(
      [],
      [],
      [
        { id: 1 },
        { id: 2 },
        { id: 3 },
        { id: 4 },
      ],
      [
        { prospectId: 1 },
      ],
    );

    const result = await service.getKpi({
      startDate,
      endDate,
    });

    expect(prismaMock.prospect.findMany).toHaveBeenCalledWith({
      where: {
        firstContactDate: {
          not: null,
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
      },
    });

    expect(result.contactedProspects).toBe(4);
    expect(result.convertedProspects).toBe(1);
    expect(result.conversionRate).toBe(25);
  });

  it('should include conversions signed after the first contact year', async () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-12-31');

    mockQueries(
      [],
      [],
      [
        { id: 1 },
        { id: 2 },
      ],
      [
        { prospectId: 1 },
      ],
    );

    const result = await service.getKpi({
      startDate,
      endDate,
    });

    expect(prismaMock.mission.findMany).toHaveBeenNthCalledWith(
      3,
      {
        where: {
          status: {
            not: StatutMission.DEVIS,
          },
          signedAt: {
            not: null,
          },
          prospectId: {
            in: [1, 2],
          },
        },
        select: {
          prospectId: true,
        },
      },
    );

    expect(result.convertedProspects).toBe(1);
    expect(result.conversionRate).toBe(50);
  });

  it('should apply the domain filter to conversion', async () => {
    mockQueries(
      [],
      [],
      [
        { id: 1 },
        { id: 2 },
        { id: 3 },
      ],
      [
        { prospectId: 1 },
      ],
    );

    const result = await service.getKpi({
      domain: Domaine.INFORMATIQUE,
    });

    expect(prismaMock.prospect.findMany).toHaveBeenCalledWith({
      where: {
        domain: Domaine.INFORMATIQUE,
        firstContactDate: {
          not: null,
        },
      },
      select: {
        id: true,
      },
    });

    expect(prismaMock.mission.findMany).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        where: {
          domain: Domaine.INFORMATIQUE,
          status: {
            not: StatutMission.DEVIS,
          },
          signedAt: {
            not: null,
          },
          prospectId: {
            in: [1, 2, 3],
          },
        },
      }),
    );

    expect(result.contactedProspects).toBe(3);
    expect(result.convertedProspects).toBe(1);
    expect(result.conversionRate).toBe(33.33);
  });

  it('should pass domain and date filters to Prisma', async () => {
    mockQueries();

    const startDate = new Date('2026-01-01');
    const endDate = new Date('2026-12-31');

    const result = await service.getKpi({
      domain: Domaine.INFORMATIQUE,
      startDate,
      endDate,
    });

    expect(prismaMock.mission.findMany).toHaveBeenNthCalledWith(
      1,
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

    expect(prismaMock.mission.findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: {
          domain: Domaine.INFORMATIQUE,
          status: {
            not: StatutMission.DEVIS,
          },
          signedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
    );

    expect(prismaMock.prospect.findMany).toHaveBeenCalledWith({
      where: {
        domain: Domaine.INFORMATIQUE,
        firstContactDate: {
          not: null,
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
      },
    });

    expect(result.filters).toEqual({
      domain: Domaine.INFORMATIQUE,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });
  });
});