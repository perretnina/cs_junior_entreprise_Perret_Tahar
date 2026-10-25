import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { AuthService } from './auth.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

vi.mock('bcrypt', () => ({ compare: vi.fn() }));

describe('AuthService', () => {
  let service: AuthService;
  const prismaMock = { user: { findUnique: vi.fn() } };
  const jwtMock = { signAsync: vi.fn() };
  const validUser = {
    id: 1,
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    isBureau: true,
    bureauValidUntil: new Date('2099-12-31T23:59:59.999Z'),
    isIntervenant: true,
    intervenant: {
      id: 10,
      firstName: 'Alice',
      lastName: 'Martin',
      schoolEndDate: new Date('2099-06-30T00:00:00.000Z'),
    },
  };

  const login = (activeSpace: 'bureau' | 'intervenant', password = 'password123') =>
    service.login({ email: 'test@example.com', password, activeSpace });

  beforeEach(async () => {
    vi.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
      ],
    }).compile();
    service = module.get(AuthService);
    prismaMock.user.findUnique.mockResolvedValue(validUser);
    vi.mocked(compare).mockResolvedValue(true as never);
    jwtMock.signAsync.mockResolvedValue('fake-jwt-token');
  });

  it('authorizes a valid Bureau login', async () => {
    const result = await login('bureau');
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
      include: { intervenant: true },
    });
    expect(jwtMock.signAsync).toHaveBeenCalledWith({ sub: 1, activeSpace: 'bureau' });
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

  it('authorizes a valid Intervenant login', async () => {
    const result = await login('intervenant');
    expect(jwtMock.signAsync).toHaveBeenCalledWith({ sub: 1, activeSpace: 'intervenant' });
    expect(result.user.isIntervenant).toBe(true);
  });

  it('rejects an unknown email', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(login('bureau')).rejects.toThrow('Identifiants incorrects');
    expect(compare).not.toHaveBeenCalled();
    expect(jwtMock.signAsync).not.toHaveBeenCalled();
  });

  it('rejects an incorrect password', async () => {
    vi.mocked(compare).mockResolvedValue(false as never);
    await expect(login('bureau', 'wrong-password')).rejects.toThrow('Identifiants incorrects');
    expect(jwtMock.signAsync).not.toHaveBeenCalled();
  });

  it('rejects a Bureau login after mandate expiration', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      ...validUser,
      bureauValidUntil: new Date('2020-12-31T23:59:59.999Z'),
    });
    await expect(login('bureau')).rejects.toThrow('Votre mandat au Bureau a expiré. Vous ne pouvez plus accéder à cet espace.');
    expect(jwtMock.signAsync).not.toHaveBeenCalled();
  });

  it('rejects a Bureau login for a non-Bureau user', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ ...validUser, isBureau: false });
    await expect(login('bureau')).rejects.toThrow("Ce compte ne dispose pas d'un accès à l'espace Bureau.");
    expect(jwtMock.signAsync).not.toHaveBeenCalled();
  });

  it('rejects an Intervenant login after the end of school', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      ...validUser,
      intervenant: { ...validUser.intervenant, schoolEndDate: new Date('2020-06-30') },
    });
    await expect(login('intervenant')).rejects.toThrow('Votre scolarité est terminée. Vous ne pouvez plus accéder à cet espace.');
    expect(jwtMock.signAsync).not.toHaveBeenCalled();
  });

  it('rejects Intervenant login without a linked profile', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ ...validUser, intervenant: null });
    await expect(login('intervenant')).rejects.toThrow("Ce compte ne dispose pas d'un accès à l'espace Intervenant.");
    expect(jwtMock.signAsync).not.toHaveBeenCalled();
  });

  it('rejects an Intervenant login without the role', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ ...validUser, isIntervenant: false });
    await expect(login('intervenant')).rejects.toThrow("Ce compte ne dispose pas d'un accès à l'espace Intervenant.");
    expect(jwtMock.signAsync).not.toHaveBeenCalled();
  });

  it('allows Intervenant login after Bureau expiration', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      ...validUser,
      bureauValidUntil: new Date('2020-12-31'),
    });
    const result = await login('intervenant');
    expect(result.user.isBureau).toBe(false);
    expect(result.user.isIntervenant).toBe(true);
  });

  it('allows Bureau login after Intervenant expiration', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      ...validUser,
      intervenant: { ...validUser.intervenant, schoolEndDate: new Date('2020-06-30') },
    });
    const result = await login('bureau');
    expect(result.user.isBureau).toBe(true);
    expect(result.user.isIntervenant).toBe(false);
  });

  it('keeps Bureau access valid on its final calendar day', async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-12-31T12:00:00.000Z'));
      prismaMock.user.findUnique.mockResolvedValue({ ...validUser, bureauValidUntil: new Date('2026-12-31T00:00:00.000Z') });
      expect((await login('bureau')).user.isBureau).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps Intervenant access valid on the final school day', async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-06-30T12:00:00.000Z'));
      prismaMock.user.findUnique.mockResolvedValue({ ...validUser, intervenant: { ...validUser.intervenant, schoolEndDate: new Date('2026-06-30T00:00:00.000Z') } });
      expect((await login('intervenant')).user.isIntervenant).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('returns only active roles in the profile', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      ...validUser,
      bureauValidUntil: new Date('2020-12-31'),
    });
    const result = await service.getProfile(1);
    expect(result.isBureau).toBe(false);
    expect(result.isIntervenant).toBe(true);
    expect(result.intervenantId).toBe(10);
    expect(result.firstName).toBe('Alice');
    expect(result.schoolEndDate).toEqual(validUser.intervenant.schoolEndDate);
  });

  it('returns inactive Intervenant access after the end of school', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      ...validUser,
      intervenant: { ...validUser.intervenant, schoolEndDate: new Date('2020-06-30') },
    });
    const result = await service.getProfile(1);
    expect(result.isBureau).toBe(true);
    expect(result.isIntervenant).toBe(false);
  });

  it('returns null profile fields without an Intervenant', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ ...validUser, intervenant: null });
    const result = await service.getProfile(1);
    expect(result.intervenantId).toBeNull();
    expect(result.firstName).toBeNull();
    expect(result.lastName).toBeNull();
    expect(result.schoolEndDate).toBeNull();
  });

  it('rejects an unknown profile', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(service.getProfile(999)).rejects.toThrow('Utilisateur introuvable');
  });
});
