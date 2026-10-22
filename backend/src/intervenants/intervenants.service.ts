import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateIntervenantDto } from './dto/create-intervenant.dto.js';
import { NotFoundException } from '@nestjs/common';
import { UpdateIntervenantDto } from './dto/update-intervenant.dto.js';

@Injectable()
export class IntervenantsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.intervenant.findMany({
      orderBy: {
        lastName: 'asc',
      },
      include: {
        missions: {
          include: {
            mission: true,
          },
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