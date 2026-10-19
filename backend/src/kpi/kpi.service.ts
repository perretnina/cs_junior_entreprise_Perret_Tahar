
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  Domaine,
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

    // Filtrage par domaine et date de début de mission
    const missionWhere = {
      ...(domain ? { domain } : {}),
      ...(startDate || endDate
        ? {
            startDate: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate ? { lte: endDate } : {}),
            },
          }
        : {}),
    };

    const missions = await this.prisma.mission.findMany({
      where: missionWhere,
      select: {
        id: true,
        price: true,
        startDate: true,
        endDate: true,
        signedAt: true,
        prospectId: true,
        intervenants: {
          select: {
            intervenantId: true,
          },
        },
      },
    });

    // Missions signées
    const signedMissions = missions.filter(
      (mission) => mission.signedAt !== null,
    );

    // 1. Nombre total de missions
    const totalMissions = missions.length;

    // 2. Chiffre d'affaires signé
    const signedRevenue = signedMissions.reduce(
      (sum, mission) => sum + Number(mission.price),
      0,
    );

    // 3. Prix moyen des missions signées
    const averageSignedPrice =
      signedMissions.length > 0
        ? signedRevenue / signedMissions.length
        : 0;

    // 4. Durée moyenne des missions, en jours
    const totalDuration = missions.reduce((sum, mission) => {
      const duration =
        (mission.endDate.getTime() -
          mission.startDate.getTime()) /
        (1000 * 60 * 60 * 24);

      return sum + duration;
    }, 0);

    const averageDurationDays =
      totalMissions > 0 ? totalDuration / totalMissions : 0;

    // 5. Nombre d'intervenants distincts
    const intervenantIds = new Set(
      missions.flatMap((mission) =>
        mission.intervenants.map(
          (assignment) => assignment.intervenantId,
        ),
      ),
    );

    const distinctIntervenants = intervenantIds.size;

    // 6. Taux de conversion des prospects contactés
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
