import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  Domaine,
  StatutMission,
} from '../generated/prisma/enums.js';

@Injectable()
export class KpiService {
  constructor(private readonly prisma: PrismaService) {}

  async getKpi(filters: {
    domain?: Domaine;
    startDate?: Date;
    endDate?: Date;
  }) {
    const { domain, startDate, endDate } = filters;

    const operationalMissions = await this.prisma.mission.findMany({
      where: {
        ...(domain ? { domain } : {}),
        ...(startDate || endDate
          ? {
              startDate: {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {}),
              },
            }
          : {}),
      },
      select: {
        id: true,
        price: true,
        startDate: true,
        endDate: true,
        intervenants: {
          select: {
            intervenantId: true,
          },
        },
      },
    });

    const signedMissions = await this.prisma.mission.findMany({
      where: {
        ...(domain ? { domain } : {}),
        status: {
          not: StatutMission.DEVIS,
        },
        ...(startDate || endDate
          ? {
              signedAt: {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {}),
              },
            }
          : {}),
      },
      select: {
        id: true,
        price: true,
        signedAt: true,
        prospectId: true,
      },
    });

    const totalMissions = operationalMissions.length;

    const signedRevenue = signedMissions.reduce(
      (sum, mission) => sum + Number(mission.price),
      0,
    );

    const averageSignedPrice =
      signedMissions.length > 0
        ? signedRevenue / signedMissions.length
        : 0;

    const totalDuration = operationalMissions.reduce(
      (sum, mission) => {
        const duration =
          (mission.endDate.getTime() -
            mission.startDate.getTime()) /
          (1000 * 60 * 60 * 24);

        return sum + duration;
      },
      0,
    );

    const averageDurationDays =
      totalMissions > 0 ? totalDuration / totalMissions : 0;

    const intervenantIds = new Set(
      operationalMissions.flatMap((mission) =>
        mission.intervenants.map(
          (assignment) => assignment.intervenantId,
        ),
      ),
    );

    const distinctIntervenants = intervenantIds.size;

    const prospects = await this.prisma.prospect.findMany({
      where: {
        ...(domain ? { domain } : {}),
        firstContactDate: {
          not: null,
          ...(startDate ? { gte: startDate } : {}),
          ...(endDate ? { lte: endDate } : {}),
        },
      },
      select: {
        id: true,
      },
    });

    const contactedProspectIds = new Set(
      prospects.map((prospect) => prospect.id),
    );

    const convertedMissions = await this.prisma.mission.findMany({
      where: {
        ...(domain ? { domain } : {}),
        status: {
          not: StatutMission.DEVIS,
        },
        signedAt: {
          not: null,
        },
        prospectId: {
          in: [...contactedProspectIds],
        },
      },
      select: {
        prospectId: true,
      },
    });

    const convertedProspectIds = new Set(
      convertedMissions.map((mission) => mission.prospectId),
    );

    const contactedProspects = contactedProspectIds.size;
    const convertedProspects = convertedProspectIds.size;

    const conversionRate =
      contactedProspects > 0
        ? (convertedProspects / contactedProspects) * 100
        : 0;

    const round = (value: number) =>
      Math.round(value * 100) / 100;

    return {
      filters: {
        domain: domain ?? null,
        startDate: startDate?.toISOString().slice(0, 10) ?? null,
        endDate: endDate?.toISOString().slice(0, 10) ?? null,
      },
      totalMissions,
      signedRevenue: round(signedRevenue),
      averageSignedPrice: round(averageSignedPrice),
      averageDurationDays: round(averageDurationDays),
      distinctIntervenants,
      conversionRate: round(conversionRate),
      contactedProspects,
      convertedProspects,
    };
  }
}