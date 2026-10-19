
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';

import { AuthService } from './auth.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

vi.mock('bcrypt', () => ({
  compare: vi.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  const prismaMock = {
    user: {
      findUnique: vi.fn(),
    },
  };

  const jwtMock = {
    signAsync: vi.fn(),
  };

  const validUser = {
    id: 1,
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    isBureau: true,
    bureauValidUntil: new Date('2099-12-31'),
    isIntervenant: true,
    intervenant: {
      id: 10,
      firstName: 'Alice',
      lastName: 'Martin',
      schoolEndDate: new Date('2099-06-30'),
    },
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          AuthService,
          {
            provide: PrismaService,
            useValue: prismaMock,
          },
          {
            provide: JwtService,
            useValue: jwtMock,
          },
        ],
      }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should login a user with valid credentials', async () => {
    prismaMock.user.findUnique.mockResolvedValue(validUser);
    vi.mocked(compare).mockResolvedValue(true as never);
    jwtMock.signAsync.mockResolvedValue('fake-jwt-token');

    const result = await service.login({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
      include: { intervenant: true },
    });

    expect(jwtMock.signAsync).toHaveBeenCalledWith({
      sub: 1,
    });

    expect(result).toEqual({
      accessToken: 'fake-jwt-token',
      user: {
        id: 1,
        email: 'test@example.com',
        isBureau: true,
        isIntervenant: true,
        intervenantId: 10,
      },
    });
  });

  it('should reject an unknown email', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(
      service.login({
        email: 'unknown@example.com',
        password: 'password123',
      }),
    ).rejects.toThrow(
      new UnauthorizedException('Identifiants incorrects'),
    );

    expect(compare).not.toHaveBeenCalled();
    expect(jwtMock.signAsync).not.toHaveBeenCalled();
  });

  it('should reject an incorrect password', async () => {
    prismaMock.user.findUnique.mockResolvedValue(validUser);
    vi.mocked(compare).mockResolvedValue(false as never);

    await expect(
      service.login({
        email: 'test@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toThrow(
      new UnauthorizedException('Identifiants incorrects'),
    );

    expect(jwtMock.signAsync).not.toHaveBeenCalled();
  });

  it('should reject a user without active access', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      ...validUser,
      isBureau: false,
      isIntervenant: false,
    });

    vi.mocked(compare).mockResolvedValue(true as never);

    await expect(
      service.login({
        email: 'test@example.com',
        password: 'password123',
      }),
    ).rejects.toThrow(
      new UnauthorizedException('Aucun accès actif'),
    );

    expect(jwtMock.signAsync).not.toHaveBeenCalled();
  });

  it('should reject a user with an expired Bureau mandate and no Intervenant access', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      ...validUser,
      isBureau: true,
      bureauValidUntil: new Date('2020-01-01'),
      isIntervenant: false,
    });

    vi.mocked(compare).mockResolvedValue(true as never);

    await expect(
      service.login({
        email: 'test@example.com',
        password: 'password123',
      }),
    ).rejects.toThrow(
      new UnauthorizedException('Aucun accès actif'),
    );
  });

  it('should allow Intervenant access after Bureau mandate expiration', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      ...validUser,
      bureauValidUntil: new Date('2020-01-01'),
      isIntervenant: true,
    });

    vi.mocked(compare).mockResolvedValue(true as never);
    jwtMock.signAsync.mockResolvedValue('intervenant-token');

    const result = await service.login({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.user.isBureau).toBe(false);
    expect(result.user.isIntervenant).toBe(true);
    expect(result.accessToken).toBe('intervenant-token');
  });

  it('should allow a Bureau member without Intervenant access', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      ...validUser,
      isIntervenant: false,
      intervenant: null,
    });

    vi.mocked(compare).mockResolvedValue(true as never);
    jwtMock.signAsync.mockResolvedValue('bureau-token');

    const result = await service.login({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.user.isBureau).toBe(true);
    expect(result.user.isIntervenant).toBe(false);
    expect(result.user.intervenantId).toBeNull();
  });

  it('should return the user profile', async () => {
    prismaMock.user.findUnique.mockResolvedValue(validUser);

    const result = await service.getProfile(1);

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: { intervenant: true },
    });

    expect(result).toEqual({
      id: 1,
      email: 'test@example.com',
      isBureau: true,
      isIntervenant: true,
      intervenantId: 10,
      firstName: 'Alice',
      lastName: 'Martin',
      schoolEndDate: new Date('2099-06-30'),
      bureauValidUntil: new Date('2099-12-31'),
    });
  });

  it('should reject a profile request for an unknown user', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(
      service.getProfile(999),
    ).rejects.toThrow(
      new UnauthorizedException('Utilisateur introuvable'),
    );
  });

  it('should return null profile fields when there is no linked Intervenant', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      ...validUser,
      intervenant: null,
    });

    const result = await service.getProfile(1);

    expect(result.intervenantId).toBeNull();
    expect(result.firstName).toBeNull();
    expect(result.lastName).toBeNull();
    expect(result.schoolEndDate).toBeNull();
  });
});
