
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { ProspectsService } from './prospects.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { Domaine } from '../generated/prisma/enums.js';

describe('ProspectsService', () => {
  let service: ProspectsService;

  const prismaMock = {
    prospect: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };

  const validProspect = {
    id: 1,
    name: 'Entreprise ABC',
    email: 'contact@abc.fr',
    phone: '0612345678',
    domain: Domaine.INFORMATIQUE,
    status: 'PAS_ENCORE_CONTACTE',
  };

  const prospectWithMissions = {
    ...validProspect,
    missions: [
      {
        id: 10,
        title: 'Développement application web',
        status: 'EN_COURS',
      },
    ],
  };

  const prospectWithoutMissions = {
    ...validProspect,
    missions: [],
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          ProspectsService,
          {
            provide: PrismaService,
            useValue: prismaMock,
          },
        ],
      }).compile();

    service = module.get<ProspectsService>(
      ProspectsService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all prospects', async () => {
      const prospects = [
        {
          ...validProspect,
          _count: { missions: 1 },
        },
      ];

      prismaMock.prospect.findMany.mockResolvedValue(prospects);

      const result = await service.findAll();

      expect(result).toEqual(prospects);
    });

    it('should order prospects by ID descending', async () => {
      prismaMock.prospect.findMany.mockResolvedValue([]);

      await service.findAll();

      expect(prismaMock.prospect.findMany).toHaveBeenCalledWith({
        orderBy: {
          id: 'desc',
        },
        include: {
          _count: {
            select: {
              missions: true,
            },
          },
        },
      });
    });

    it('should return an empty array when there are no prospects', async () => {
      prismaMock.prospect.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a prospect with its missions', async () => {
      prismaMock.prospect.findUnique.mockResolvedValue(
        prospectWithMissions,
      );

      const result = await service.findOne(1);

      expect(result).toEqual(prospectWithMissions);

      expect(prismaMock.prospect.findUnique).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
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
    });

    it('should throw NotFoundException for an unknown prospect', async () => {
      prismaMock.prospect.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne(999),
      ).rejects.toThrow(
        new NotFoundException('Prospect introuvable'),
      );
    });
  });

  describe('create', () => {
    it('should create a prospect with all fields', async () => {
      const dto = {
        name: 'Entreprise ABC',
        email: 'contact@abc.fr',
        phone: '0612345678',
        domain: Domaine.INFORMATIQUE,
      };

      prismaMock.prospect.create.mockResolvedValue(
        validProspect,
      );

      const result = await service.create(dto);

      expect(result).toEqual(validProspect);

      expect(prismaMock.prospect.create).toHaveBeenCalledWith({
        data: {
          name: 'Entreprise ABC',
          email: 'contact@abc.fr',
          phone: '0612345678',
          domain: Domaine.INFORMATIQUE,
        },
      });
    });

    it('should set email and phone to null when omitted', async () => {
      const dto = {
        name: 'Entreprise XYZ',
        domain: Domaine.INFORMATIQUE,
      };

      prismaMock.prospect.create.mockResolvedValue({
        ...validProspect,
        name: dto.name,
        email: null,
        phone: null,
      });

      await service.create(dto);

      expect(prismaMock.prospect.create).toHaveBeenCalledWith({
        data: {
          name: 'Entreprise XYZ',
          email: null,
          phone: null,
          domain: Domaine.INFORMATIQUE,
        },
      });
    });

    it('should include status when explicitly provided', async () => {
      const dto = {
        name: 'Entreprise ABC',
        domain: Domaine.INFORMATIQUE,
        status: 'CONTACTE' as never,
      };

      prismaMock.prospect.create.mockResolvedValue(
        validProspect,
      );

      await service.create(dto);

      expect(prismaMock.prospect.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'CONTACTE',
        }),
      });
    });
  });

  describe('update', () => {
    it('should update an existing prospect', async () => {
      prismaMock.prospect.findUnique.mockResolvedValue(
        prospectWithoutMissions,
      );

      const updatedProspect = {
        ...validProspect,
        name: 'Nouveau nom',
      };

      prismaMock.prospect.update.mockResolvedValue(
        updatedProspect,
      );

      const result = await service.update(1, {
        name: 'Nouveau nom',
      });

      expect(result).toEqual(updatedProspect);

      expect(prismaMock.prospect.update).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
        data: {
          name: 'Nouveau nom',
        },
      });
    });

    it('should update only the provided fields', async () => {
      prismaMock.prospect.findUnique.mockResolvedValue(
        prospectWithoutMissions,
      );

      prismaMock.prospect.update.mockResolvedValue(
        validProspect,
      );

      await service.update(1, {
        email: 'nouveau@example.com',
      });

      expect(prismaMock.prospect.update).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
        data: {
          email: 'nouveau@example.com',
        },
      });
    });

    it('should allow updating the prospect status', async () => {
      prismaMock.prospect.findUnique.mockResolvedValue(
        prospectWithoutMissions,
      );

      prismaMock.prospect.update.mockResolvedValue(
        validProspect,
      );

      await service.update(1, {
        status: 'CONTACTE' as never,
      });

      expect(prismaMock.prospect.update).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
        data: {
          status: 'CONTACTE',
        },
      });
    });

    it('should throw NotFoundException for an unknown prospect', async () => {
      prismaMock.prospect.findUnique.mockResolvedValue(null);

      await expect(
        service.update(999, {
          name: 'Nouveau nom',
        }),
      ).rejects.toThrow(
        new NotFoundException('Prospect introuvable'),
      );

      expect(prismaMock.prospect.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a prospect without missions', async () => {
      prismaMock.prospect.findUnique.mockResolvedValue(
        prospectWithoutMissions,
      );

      prismaMock.prospect.delete.mockResolvedValue(
        validProspect,
      );

      const result = await service.remove(1);

      expect(prismaMock.prospect.delete).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
      });

      expect(result).toEqual({
        message: 'Prospect supprimé',
      });
    });

    it('should reject deletion when the prospect has missions', async () => {
      prismaMock.prospect.findUnique.mockResolvedValue(
        prospectWithMissions,
      );

      await expect(
        service.remove(1),
      ).rejects.toThrow(
        new BadRequestException(
          'Impossible de supprimer un prospect associé à une mission',
        ),
      );

      expect(prismaMock.prospect.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when deleting an unknown prospect', async () => {
      prismaMock.prospect.findUnique.mockResolvedValue(null);

      await expect(
        service.remove(999),
      ).rejects.toThrow(
        new NotFoundException('Prospect introuvable'),
      );

      expect(prismaMock.prospect.delete).not.toHaveBeenCalled();
    });
  });
});
