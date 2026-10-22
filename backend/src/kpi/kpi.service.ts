
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  Domaine,
  StatutMission,
  StatutProspect,
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

    // All signed missions are included, regardless of their current status.
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

    // 1. Total missions, filtered by their start date.
    const totalMissions = operationalMissions.length;

    // 2. Signed revenue, filtered by signature date.
    const signedRevenue = signedMissions.reduce(
      (sum, mission) => sum + Number(mission.price),
      0,
    );

    // 3. Average price of signed missions.
    const averageSignedPrice =
      signedMissions.length > 0
        ? signedRevenue / signedMissions.length
        : 0;

    // 4. Average mission duration in days.
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

    // 5. Distinct assigned intervenants.
    const intervenantIds = new Set(
      operationalMissions.flatMap((mission) =>
        mission.intervenants.map(
          (assignment) => assignment.intervenantId,
        ),
      ),
    );

    const distinctIntervenants = intervenantIds.size;

    // 6. Contacted prospects in the selected domain.
    const prospects = await this.prisma.prospect.findMany({
      where: {
        ...(domain ? { domain } : {}),
        status: {
          not: StatutProspect.PAS_ENCORE_CONTACTE,
        },
      },
      select: {
        id: true,
      },
    });

    const contactedProspectIds = new Set(
      prospects.map((prospect) => prospect.id),
    );

    // A prospect is converted once, even with multiple signed missions.
    const convertedProspectIds = new Set(
      signedMissions
        .map((mission) => mission.prospectId)
        .filter((id) => contactedProspectIds.has(id)),
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
