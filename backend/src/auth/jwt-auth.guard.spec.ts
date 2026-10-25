import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExecutionContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard, type AuthenticatedRequest } from './jwt-auth.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  const prismaMock = { user: { findUnique: vi.fn() } };
  const jwtMock = { verifyAsync: vi.fn() };
  const validUser = {
    id: 1,
    email: 'test@example.com',
    isBureau: true,
    bureauValidUntil: new Date('2099-12-31T23:59:59.999Z'),
    isIntervenant: true,
    intervenant: { id: 10, schoolEndDate: new Date('2099-06-30') },
  };

  function createContext(authorization?: string) {
    const request = { headers: authorization ? { authorization } : {} } as AuthenticatedRequest;
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as ExecutionContext;
    return { context, request };
  }

  function setSpace(activeSpace: 'bureau' | 'intervenant') {
    jwtMock.verifyAsync.mockResolvedValue({ sub: 1, activeSpace });
  }

  beforeEach(async () => {
    vi.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        { provide: JwtService, useValue: jwtMock },
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    guard = module.get(JwtAuthGuard);
    prismaMock.user.findUnique.mockResolvedValue(validUser);
    setSpace('bureau');
  });

  it('rejects a missing authorization header', async () => {
    await expect(guard.canActivate(createContext().context)).rejects.toThrow('Token manquant');
    expect(jwtMock.verifyAsync).not.toHaveBeenCalled();
  });

  it('rejects an authorization header without Bearer', async () => {
    await expect(guard.canActivate(createContext('Basic abc').context)).rejects.toThrow('Token manquant');
  });

  it('rejects an invalid JWT', async () => {
    jwtMock.verifyAsync.mockRejectedValue(new Error('Invalid signature'));
    await expect(guard.canActivate(createContext('Bearer invalid').context)).rejects.toThrow('Token invalide ou expiré');
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it('rejects an expired JWT', async () => {
    jwtMock.verifyAsync.mockRejectedValue(new Error('jwt expired'));
    await expect(guard.canActivate(createContext('Bearer expired').context)).rejects.toThrow('Token invalide ou expiré');
  });

  it('rejects an invalid user ID', async () => {
    jwtMock.verifyAsync.mockResolvedValue({ sub: 'invalid', activeSpace: 'bureau' });
    await expect(guard.canActivate(createContext('Bearer token').context)).rejects.toThrow('Token invalide');
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it('rejects a non-integer user ID', async () => {
    jwtMock.verifyAsync.mockResolvedValue({ sub: 1.5, activeSpace: 'bureau' });
    await expect(guard.canActivate(createContext('Bearer token').context)).rejects.toThrow('Token invalide');
  });

  it('rejects a missing activeSpace', async () => {
    jwtMock.verifyAsync.mockResolvedValue({ sub: 1 });
    await expect(guard.canActivate(createContext('Bearer token').context)).rejects.toThrow('Espace invalide');
  });

  it('rejects an unknown activeSpace', async () => {
    jwtMock.verifyAsync.mockResolvedValue({ sub: 1, activeSpace: 'admin' });
    await expect(guard.canActivate(createContext('Bearer token').context)).rejects.toThrow('Espace invalide');
  });

  it('rejects an unknown user', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(guard.canActivate(createContext('Bearer token').context)).rejects.toThrow('Utilisateur introuvable');
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: { intervenant: true },
    });
  });

  it('authorizes an active Bureau session', async () => {
    const { context, request } = createContext('Bearer token');
    expect(await guard.canActivate(context)).toBe(true);
    expect(jwtMock.verifyAsync).toHaveBeenCalledWith('token');
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: { intervenant: true },
    });
    expect(request.user).toEqual({
      id: 1,
      email: 'test@example.com',
      isBureau: true,
      isIntervenant: true,
      activeSpace: 'bureau',
    });
  });

  it('authorizes an active Intervenant session', async () => {
    setSpace('intervenant');
    const { context, request } = createContext('Bearer token');
    expect(await guard.canActivate(context)).toBe(true);
    expect(request.user.activeSpace).toBe('intervenant');
  });

  it('rejects a Bureau JWT after mandate expiration', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      ...validUser,
      bureauValidUntil: new Date('2020-12-31'),
    });
    await expect(guard.canActivate(createContext('Bearer token').context)).rejects.toThrow('Votre mandat au Bureau a expiré. Vous ne pouvez plus accéder à cet espace.');
  });

  it('rejects an Intervenant JWT after school ends', async () => {
    setSpace('intervenant');
    prismaMock.user.findUnique.mockResolvedValue({
      ...validUser,
      intervenant: { id: 10, schoolEndDate: new Date('2020-06-30') },
    });
    await expect(guard.canActivate(createContext('Bearer token').context)).rejects.toThrow('Votre scolarité est terminée. Vous ne pouvez plus accéder à cet espace.');
  });

  it('rejects an Intervenant JWT without a linked profile', async () => {
    setSpace('intervenant');
    prismaMock.user.findUnique.mockResolvedValue({ ...validUser, intervenant: null });
    await expect(guard.canActivate(createContext('Bearer token').context)).rejects.toThrow("Ce compte ne dispose pas d'un accès à l'espace Intervenant.");
  });

  it('allows an Intervenant session after Bureau expiration', async () => {
    setSpace('intervenant');
    prismaMock.user.findUnique.mockResolvedValue({
      ...validUser,
      bureauValidUntil: new Date('2020-12-31'),
    });
    const { context, request } = createContext('Bearer token');
    expect(await guard.canActivate(context)).toBe(true);
    expect(request.user.isBureau).toBe(false);
    expect(request.user.isIntervenant).toBe(true);
  });

  it('allows a Bureau session after Intervenant expiration', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      ...validUser,
      intervenant: { id: 10, schoolEndDate: new Date('2020-06-30') },
    });
    const { context, request } = createContext('Bearer token');
    expect(await guard.canActivate(context)).toBe(true);
    expect(request.user.isBureau).toBe(true);
    expect(request.user.isIntervenant).toBe(false);
  });

  it('rejects a Bureau session without Bureau role', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ ...validUser, isBureau: false });
    await expect(guard.canActivate(createContext('Bearer token').context)).rejects.toThrow("Ce compte ne dispose pas d'un accès à l'espace Bureau.");
  });

  it('rejects an Intervenant session without the role', async () => {
    setSpace('intervenant');
    prismaMock.user.findUnique.mockResolvedValue({ ...validUser, isIntervenant: false });
    await expect(guard.canActivate(createContext('Bearer token').context)).rejects.toThrow("Ce compte ne dispose pas d'un accès à l'espace Intervenant.");
  });

  it('keeps a Bureau JWT valid on the final mandate day', async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-12-31T12:00:00.000Z'));
      prismaMock.user.findUnique.mockResolvedValue({ ...validUser, bureauValidUntil: new Date('2026-12-31T00:00:00.000Z') });
      expect(await guard.canActivate(createContext('Bearer token').context)).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps an Intervenant JWT valid on the final school day', async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-06-30T12:00:00.000Z'));
      setSpace('intervenant');
      prismaMock.user.findUnique.mockResolvedValue({ ...validUser, intervenant: { id: 10, schoolEndDate: new Date('2026-06-30T00:00:00.000Z') } });
      expect(await guard.canActivate(createContext('Bearer token').context)).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('rejects a user without any active role', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      ...validUser,
      isBureau: false,
      isIntervenant: false,
    });
    await expect(guard.canActivate(createContext('Bearer token').context)).rejects.toThrow("Ce compte ne dispose pas d'un accès à l'espace Bureau.");
  });
});
