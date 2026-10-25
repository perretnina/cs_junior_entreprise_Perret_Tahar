import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateIntervenantDto } from './dto/create-intervenant.dto.js';
import { UpdateIntervenantDto } from './dto/update-intervenant.dto.js';

@Injectable()
export class IntervenantsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.intervenant.findMany({
      orderBy: { lastName: 'asc' },
      include: {
        missions: {
          include: { mission: true },
        },
      },
    });
  }

  create(dto: CreateIntervenantDto) {
    return this.prisma.intervenant.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        schoolEndDate: new Date(dto.schoolEndDate),
      },
    });
  }

  async update(id: number, dto: UpdateIntervenantDto) {
    const intervenant = await this.prisma.intervenant.findUnique({
      where: { id },
    });

    if (!intervenant) {
      throw new NotFoundException('Intervenant introuvable');
    }

    const { schoolEndDate, ...otherFields } = dto;

    if (schoolEndDate !== undefined) {
      const newSchoolEndDate = new Date(schoolEndDate);
      const conflictingAssignment = await this.prisma.missionIntervenant.findFirst({
        where: {
          intervenantId: id,
          mission: { endDate: { gt: newSchoolEndDate } },
        },
      });

      if (conflictingAssignment) {
        throw new BadRequestException(
          'La date de fin de scolarité est antérieure à la fin d’une mission affectée à cet intervenant.',
        );
      }
    }

    return this.prisma.intervenant.update({
      where: { id },
      data: {
        ...otherFields,
        ...(schoolEndDate !== undefined && {
          schoolEndDate: new Date(schoolEndDate),
        }),
      },
    });
  }

  async remove(id: number) {
    const intervenant = await this.prisma.intervenant.findUnique({
      where: { id },
    });

    if (!intervenant) {
      throw new NotFoundException('Intervenant introuvable');
    }

    return this.prisma.intervenant.delete({
      where: { id },
    });
  }
}
