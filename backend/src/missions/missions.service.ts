
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class MissionsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly missionDetails = {
    id: true,
    title: true,
    price: true,
    startDate: true,
    endDate: true,
    signedAt: true,
    status: true,
    domain: true,
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
  } as const;

  async findAllForBureau() {
    return this.prisma.mission.findMany({
      select: this.missionDetails,
      orderBy: { startDate: 'desc' },
    });
  }

  async findOneForBureau(id: number) {
    const mission = await this.prisma.mission.findUnique({
      where: { id },
      select: this.missionDetails,
    });

    if (!mission) {
      throw new NotFoundException('Mission introuvable');
    }

    return mission;
  }

  async findMine(userId: number) {
    const intervenant = await this.prisma.intervenant.findUnique({
      where: { userId },
    });

    if (!intervenant) {
      return [];
    }

    return this.prisma.mission.findMany({
      where: {
        intervenants: {
          some: {
            intervenantId: intervenant.id,
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
      },
      orderBy: { startDate: 'desc' },
    });
  }
}
