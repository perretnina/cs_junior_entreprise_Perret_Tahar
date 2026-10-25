import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { IntervenantsService } from './intervenants.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('IntervenantsService', () => {
  let service: IntervenantsService;

  const prismaMock = {
    intervenant: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    missionIntervenant: {
      findFirst: vi.fn(),
    },
  };

  const validIntervenant = {
    id: 1,
    firstName: 'Alice',
    lastName: 'Martin',
    email: 'alice@example.com',
    schoolEndDate: new Date('2027-06-30'),
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntervenantsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<IntervenantsService>(IntervenantsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all intervenants ordered by last name', async () => {
      const intervenants = [
        { ...validIntervenant, id: 2, lastName: 'Bernard' },
        validIntervenant,
      ];
      prismaMock.intervenant.findMany.mockResolvedValue(intervenants);

      expect(await service.findAll()).toEqual(intervenants);
      expect(prismaMock.intervenant.findMany).toHaveBeenCalledWith({
        orderBy: { lastName: 'asc' },
        include: { missions: { include: { mission: true } } },
      });
    });

    it('should return an empty array when there are no intervenants', async () => {
      prismaMock.intervenant.findMany.mockResolvedValue([]);
      expect(await service.findAll()).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create an intervenant with valid data', async () => {
      const dto = {
        firstName: 'Alice',
        lastName: 'Martin',
        email: 'alice@example.com',
        schoolEndDate: '2027-06-30',
      };
      prismaMock.intervenant.create.mockResolvedValue(validIntervenant);

      expect(await service.create(dto)).toEqual(validIntervenant);
      expect(prismaMock.intervenant.create).toHaveBeenCalledWith({
        data: { ...dto, schoolEndDate: new Date('2027-06-30') },
      });
    });

    it('should convert schoolEndDate into a Date object', async () => {
      const dto = {
        firstName: 'Bob',
        lastName: 'Durand',
        email: 'bob@example.com',
        schoolEndDate: '2028-12-31',
      };
      prismaMock.intervenant.create.mockResolvedValue({
        ...dto,
        id: 2,
        schoolEndDate: new Date(dto.schoolEndDate),
      });

      await service.create(dto);
      expect(prismaMock.intervenant.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ schoolEndDate: new Date('2028-12-31') }),
      });
    });
  });

  describe('update', () => {
    it('should update an existing intervenant without changing schoolEndDate', async () => {
      const dto = { firstName: 'Alicia', lastName: 'Martin' };
      const updated = { ...validIntervenant, firstName: 'Alicia' };
      prismaMock.intervenant.findUnique.mockResolvedValue(validIntervenant);
      prismaMock.intervenant.update.mockResolvedValue(updated);

      expect(await service.update(1, dto)).toEqual(updated);
      expect(prismaMock.intervenant.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(prismaMock.missionIntervenant.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.intervenant.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: dto,
      });
    });

    it('should accept a new schoolEndDate when no mission conflicts', async () => {
      prismaMock.intervenant.findUnique.mockResolvedValue(validIntervenant);
      prismaMock.missionIntervenant.findFirst.mockResolvedValue(null);
      prismaMock.intervenant.update.mockResolvedValue({
        ...validIntervenant,
        schoolEndDate: new Date('2028-06-30'),
      });

      await service.update(1, { schoolEndDate: '2028-06-30' });

      expect(prismaMock.missionIntervenant.findFirst).toHaveBeenCalledWith({
        where: {
          intervenantId: 1,
          mission: { endDate: { gt: new Date('2028-06-30') } },
        },
      });
      expect(prismaMock.intervenant.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { schoolEndDate: new Date('2028-06-30') },
      });
    });

    it('should reject a schoolEndDate earlier than an assigned mission end date', async () => {
      prismaMock.intervenant.findUnique.mockResolvedValue(validIntervenant);
      prismaMock.missionIntervenant.findFirst.mockResolvedValue({
        intervenantId: 1,
        missionId: 10,
      });

      await expect(service.update(1, { schoolEndDate: '2027-05-31' })).rejects.toThrow(
        new BadRequestException(
          'La date de fin de scolarité est antérieure à la fin d’une mission affectée à cet intervenant.',
        ),
      );
      expect(prismaMock.missionIntervenant.findFirst).toHaveBeenCalledWith({
        where: {
          intervenantId: 1,
          mission: { endDate: { gt: new Date('2027-05-31') } },
        },
      });
      expect(prismaMock.intervenant.update).not.toHaveBeenCalled();
    });

    it('should allow a schoolEndDate equal to the last mission day', async () => {
      prismaMock.intervenant.findUnique.mockResolvedValue(validIntervenant);
      prismaMock.missionIntervenant.findFirst.mockResolvedValue(null);
      prismaMock.intervenant.update.mockResolvedValue(validIntervenant);

      await service.update(1, { schoolEndDate: '2027-06-30' });

      expect(prismaMock.missionIntervenant.findFirst).toHaveBeenCalledWith({
        where: {
          intervenantId: 1,
          mission: { endDate: { gt: new Date('2027-06-30') } },
        },
      });
      expect(prismaMock.intervenant.update).toHaveBeenCalledOnce();
    });

    it('should not check missions when only the email changes', async () => {
      prismaMock.intervenant.findUnique.mockResolvedValue(validIntervenant);
      prismaMock.intervenant.update.mockResolvedValue({
        ...validIntervenant,
        email: 'new@example.com',
      });

      await service.update(1, { email: 'new@example.com' });

      expect(prismaMock.missionIntervenant.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.intervenant.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { email: 'new@example.com' },
      });
    });

    it('should throw NotFoundException for an unknown intervenant', async () => {
      prismaMock.intervenant.findUnique.mockResolvedValue(null);

      await expect(service.update(999, { schoolEndDate: '2028-06-30' })).rejects.toThrow(
        new NotFoundException('Intervenant introuvable'),
      );
      expect(prismaMock.missionIntervenant.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.intervenant.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete an existing intervenant', async () => {
      prismaMock.intervenant.findUnique.mockResolvedValue(validIntervenant);
      prismaMock.intervenant.delete.mockResolvedValue(validIntervenant);

      expect(await service.remove(1)).toEqual(validIntervenant);
      expect(prismaMock.intervenant.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(prismaMock.intervenant.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException for an unknown intervenant', async () => {
      prismaMock.intervenant.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(
        new NotFoundException('Intervenant introuvable'),
      );
      expect(prismaMock.intervenant.delete).not.toHaveBeenCalled();
    });
  });
});
