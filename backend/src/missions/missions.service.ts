
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateMissionDto } from './dto/create-mission.dto.js';
import { UpdateMissionDto } from './dto/update-mission.dto.js';
import { StatutMission } from '../generated/prisma/enums.js';

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

  private validateSignature(
    status: StatutMission,
    signedAt: Date | null,
  ) {
    if (status !== StatutMission.DEVIS && !signedAt) {
      throw new BadRequestException(
        'La date de signature est obligatoire pour une mission signée.',
      );
    }
  }

  private async validateMission(
    prospectId: number,
    startDate: Date,
    endDate: Date,
    intervenantIds: number[],
  ) {
    if (endDate < startDate) {
      throw new BadRequestException(
        'La date de fin doit être postérieure ou égale à la date de début.',
      );
    }

    const prospect = await this.prisma.prospect.findUnique({
      where: { id: prospectId },
    });

    if (!prospect) {
      throw new BadRequestException(
        'Le prospect sélectionné est introuvable.',
      );
    }

    if (intervenantIds.length === 0) {
      return;
    }

    const intervenants = await this.prisma.intervenant.findMany({
      where: {
        id: { in: intervenantIds },
      },
    });

    if (intervenants.length !== intervenantIds.length) {
      throw new BadRequestException(
        'Un ou plusieurs intervenants sont introuvables.',
      );
    }

    for (const intervenant of intervenants) {
      if (intervenant.schoolEndDate < endDate) {
        throw new BadRequestException(
          `${intervenant.firstName} ${intervenant.lastName} termine sa scolarité avant la fin de la mission.`,
        );
      }
    }
  }

  async create(dto: CreateMissionDto) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    const signedAt = dto.signedAt
      ? new Date(dto.signedAt)
      : null;

    this.validateSignature(dto.status, signedAt);

    await this.validateMission(
      dto.prospectId,
      startDate,
      endDate,
      dto.intervenantIds,
    );

    return this.prisma.mission.create({
      data: {
        title: dto.title,
        price: dto.price,
        startDate,
        endDate,
        signedAt,
        status: dto.status,
        domain: dto.domain,
        prospect: {
          connect: { id: dto.prospectId },
        },
        intervenants: {
          create: dto.intervenantIds.map((id) => ({
            intervenant: {
              connect: { id },
            },
          })),
        },
      },
      select: this.missionDetails,
    });
  }

  async update(id: number, dto: UpdateMissionDto) {
    const mission = await this.prisma.mission.findUnique({
      where: { id },
      include: {
        intervenants: true,
      },
    });

    if (!mission) {
      throw new NotFoundException('Mission introuvable');
    }

    const startDate = dto.startDate
      ? new Date(dto.startDate)
      : mission.startDate;

    const endDate = dto.endDate
      ? new Date(dto.endDate)
      : mission.endDate;

    const prospectId = dto.prospectId ?? mission.prospectId;

    const intervenantIds =
      dto.intervenantIds ??
      mission.intervenants.map(
        (assignment) => assignment.intervenantId,
      );

    const status = dto.status ?? mission.status;

    const signedAt =
      dto.signedAt !== undefined
        ? dto.signedAt
          ? new Date(dto.signedAt)
          : null
        : mission.signedAt;

    this.validateSignature(status, signedAt);

    await this.validateMission(
      prospectId,
      startDate,
      endDate,
      intervenantIds,
    );

    return this.prisma.mission.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && {
          title: dto.title,
        }),
        ...(dto.price !== undefined && {
          price: dto.price,
        }),
        ...(dto.startDate !== undefined && {
          startDate,
        }),
        ...(dto.endDate !== undefined && {
          endDate,
        }),
        ...(dto.signedAt !== undefined && {
          signedAt: dto.signedAt
            ? new Date(dto.signedAt)
            : null,
        }),
        ...(dto.status !== undefined && {
          status: dto.status,
        }),
        ...(dto.domain !== undefined && {
          domain: dto.domain,
        }),
        ...(dto.prospectId !== undefined && {
          prospect: {
            connect: { id: dto.prospectId },
          },
        }),
        ...(dto.intervenantIds !== undefined && {
          intervenants: {
            deleteMany: {},
            create: dto.intervenantIds.map((intervenantId) => ({
              intervenant: {
                connect: { id: intervenantId },
              },
            })),
          },
        }),
      },
      select: this.missionDetails,
    });
  }

  async remove(id: number) {
    const mission = await this.prisma.mission.findUnique({
      where: { id },
    });

    if (!mission) {
      throw new NotFoundException('Mission introuvable');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.missionIntervenant.deleteMany({
        where: { missionId: id },
      });

      await tx.mission.delete({
        where: { id },
      });
    });

    return { message: 'Mission supprimée avec succès.' };
  }
}
