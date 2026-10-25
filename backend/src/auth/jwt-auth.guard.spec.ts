import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';

import {
  JwtAuthGuard,
  type AuthenticatedRequest,
} from './jwt-auth.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  const prismaMock = {
    user: {
      findUnique: vi.fn(),
    },
  };

  const jwtMock = {
    verifyAsync: vi.fn(),
  };

  const validUser = {
    id: 1,
    email: 'test@example.com',
    isBureau: true,
    bureauValidUntil: new Date('2099-12-31'),
    isIntervenant: true,
  };

  function createContext(authorization?: string) {
    const request = {
      headers: authorization
        ? { authorization }
        : {},
    } as AuthenticatedRequest;

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;

    return { context, request };
  }

  beforeEach(async () => {
    vi.resetAllMocks();

    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          JwtAuthGuard,
          {
            provide: JwtService,
            useValue: jwtMock,
          },
          {
            provide: PrismaService,
            useValue: prismaMock,
          },
        ],
      }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should reject a request without authorization header', async () => {
    const { context } = createContext();

    await expect(
      guard.canActivate(context),
    ).rejects.toThrow(
      new UnauthorizedException('Token manquant'),
    );

    expect(jwtMock.verifyAsync).not.toHaveBeenCalled();
  });

  it('should reject an authorization header without Bearer', async () => {
    const { context } = createContext('Basic abc123');

    await expect(
      guard.canActivate(context),
    ).rejects.toThrow(
      new UnauthorizedException('Token manquant'),
    );
  });

  it('should reject an invalid token', async () => {
    const { context } = createContext('Bearer invalid-token');

    jwtMock.verifyAsync.mockRejectedValue(
      new Error('Invalid signature'),
    );

    await expect(
      guard.canActivate(context),
    ).rejects.toThrow(
      new UnauthorizedException('Token invalide ou expiré'),
    );

    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it('should reject an expired token', async () => {
    const { context } = createContext('Bearer expired-token');

    jwtMock.verifyAsync.mockRejectedValue(
      new Error('jwt expired'),
    );

    await expect(
      guard.canActivate(context),
    ).rejects.toThrow(
      new UnauthorizedException('Token invalide ou expiré'),
    );
  });

  it('should reject a token without a valid user ID', async () => {
    const { context } = createContext('Bearer malformed-token');

    jwtMock.verifyAsync.mockResolvedValue({
      sub: 'invalid-id',
      activeSpace: 'bureau',
    });

    await expect(
      guard.canActivate(context),
    ).rejects.toThrow(
      new UnauthorizedException('Token invalide'),
    );

    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it('should reject a token with a non-integer user ID', async () => {
    const { context } = createContext('Bearer decimal-id');

    jwtMock.verifyAsync.mockResolvedValue({
      sub: 1.5,
      activeSpace: 'bureau',
    });

    await expect(
      guard.canActivate(context),
    ).rejects.toThrow(
      new UnauthorizedException('Token invalide'),
    );
  });

  it('should reject a token for an unknown user', async () => {
    const { context } = createContext('Bearer valid-token');

    jwtMock.verifyAsync.mockResolvedValue({
      sub: 999,
      activeSpace: 'bureau',
    });

    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(
      guard.canActivate(context),
    ).rejects.toThrow(
      new UnauthorizedException('Utilisateur introuvable'),
    );

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: 999 },
    });
  });

  it('should reject a user without active access', async () => {
    const { context } = createContext('Bearer valid-token');

    jwtMock.verifyAsync.mockResolvedValue({
      sub: 1,
      activeSpace: 'bureau',
    });

    prismaMock.user.findUnique.mockResolvedValue({
      ...validUser,
      isBureau: false,
      isIntervenant: false,
    });

    await expect(
      guard.canActivate(context),
    ).rejects.toThrow(
      new UnauthorizedException('Aucun accès actif'),
    );
  });

  it('should reject an expired Bureau member without Intervenant access', async () => {
    const { context } = createContext('Bearer valid-token');

    jwtMock.verifyAsync.mockResolvedValue({
      sub: 1,
      activeSpace: 'bureau',
    });

    prismaMock.user.findUnique.mockResolvedValue({
      ...validUser,
      bureauValidUntil: new Date('2020-01-01'),
      isIntervenant: false,
    });

    await expect(
      guard.canActivate(context),
    ).rejects.toThrow(
      new UnauthorizedException('Aucun accès actif'),
    );
  });

  it('should authorize a valid Bureau member', async () => {
    const { context, request } =
      createContext('Bearer valid-token');

    jwtMock.verifyAsync.mockResolvedValue({
      sub: 1,
      activeSpace: 'bureau',
    });

    prismaMock.user.findUnique.mockResolvedValue(validUser);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);

    expect(jwtMock.verifyAsync).toHaveBeenCalledWith(
      'valid-token',
    );

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
    });

    expect(request.user).toEqual({
      id: 1,
      email: 'test@example.com',
      isBureau: true,
      isIntervenant: true,
      activeSpace: 'bureau',
    });
  });

  it('should authorize an Intervenant with an expired Bureau mandate', async () => {
    const { context, request } =
      createContext('Bearer valid-token');

    jwtMock.verifyAsync.mockResolvedValue({
      sub: 1,
      activeSpace: 'intervenant',
    });

    prismaMock.user.findUnique.mockResolvedValue({
      ...validUser,
      bureauValidUntil: new Date('2020-01-01'),
      isIntervenant: true,
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request.user.isBureau).toBe(false);
    expect(request.user.isIntervenant).toBe(true);
    expect(request.user.activeSpace).toBe('intervenant');
  });

  it('should authorize a Bureau member without Intervenant access', async () => {
    const { context, request } =
      createContext('Bearer valid-token');

    jwtMock.verifyAsync.mockResolvedValue({
      sub: 1,
      activeSpace: 'bureau',
    });

    prismaMock.user.findUnique.mockResolvedValue({
      ...validUser,
      isIntervenant: false,
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request.user.isBureau).toBe(true);
    expect(request.user.isIntervenant).toBe(false);
    expect(request.user.activeSpace).toBe('bureau');
  });

  it('should reject a token without activeSpace', async () => {
    const { context } = createContext('Bearer valid-token');

    jwtMock.verifyAsync.mockResolvedValue({
      sub: 1,
    });

    await expect(
      guard.canActivate(context),
    ).rejects.toThrow(
      new UnauthorizedException('Espace invalide'),
    );

    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it('should reject an invalid activeSpace', async () => {
    const { context } = createContext('Bearer valid-token');

    jwtMock.verifyAsync.mockResolvedValue({
      sub: 1,
      activeSpace: 'admin',
    });

    await expect(
      guard.canActivate(context),
    ).rejects.toThrow(
      new UnauthorizedException('Espace invalide'),
    );

    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it('should reject a Bureau session without Bureau access', async () => {
    const { context } = createContext('Bearer valid-token');

    jwtMock.verifyAsync.mockResolvedValue({
      sub: 1,
      activeSpace: 'bureau',
    });

    prismaMock.user.findUnique.mockResolvedValue({
      ...validUser,
      isBureau: false,
      isIntervenant: true,
    });

    await expect(
      guard.canActivate(context),
    ).rejects.toThrow(
      new UnauthorizedException('Accès non autorisé'),
    );
  });
});