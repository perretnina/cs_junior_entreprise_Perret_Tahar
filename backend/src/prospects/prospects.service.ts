
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProspectDto } from './dto/create-prospect.dto.js';
import { UpdateProspectDto } from './dto/update-prospect.dto.js';

@Injectable()
export class ProspectsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.prospect.findMany({
      orderBy: { id: 'desc' },
      include: {
        _count: {
          select: { missions: true },
        },
      },
    });
  }

  async findOne(id: number) {
    const prospect = await this.prisma.prospect.findUnique({
      where: { id },
      include: {
        missions: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    if (!prospect) {
      throw new NotFoundException('Prospect introuvable');
    }

    return prospect;
  }

  create(dto: CreateProspectDto) {
    return this.prisma.prospect.create({
      data: {
        name: dto.name,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        domain: dto.domain,
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
    });
  }

  async update(id: number, dto: UpdateProspectDto) {
    await this.findOne(id);

    return this.prisma.prospect.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.domain !== undefined ? { domain: dto.domain } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
    });
  }

  async remove(id: number) {
    const prospect = await this.findOne(id);

    if (prospect.missions.length > 0) {
      throw new BadRequestException(
        'Impossible de supprimer un prospect associé à une mission',
      );
    }

    await this.prisma.prospect.delete({
      where: { id },
    });

    return { message: 'Prospect supprimé' };
  }
}
