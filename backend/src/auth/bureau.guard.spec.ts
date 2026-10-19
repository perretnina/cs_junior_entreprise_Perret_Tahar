
import { describe, expect, it } from 'vitest';
import {
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

import { BureauGuard } from './bureau.guard.js';
import type { AuthenticatedRequest } from './jwt-auth.guard.js';

describe('BureauGuard', () => {
  const guard = new BureauGuard();

  function createContext(
    user?: Partial<AuthenticatedRequest['user']>,
  ): ExecutionContext {
    const request = {
      user,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
  }

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should authorize a Bureau member', () => {
    const context = createContext({
      id: 1,
      email: 'bureau@example.com',
      isBureau: true,
      isIntervenant: false,
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should authorize a user with both Bureau and Intervenant roles', () => {
    const context = createContext({
      id: 2,
      email: 'both@example.com',
      isBureau: true,
      isIntervenant: true,
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should reject an Intervenant without Bureau access', () => {
    const context = createContext({
      id: 3,
      email: 'intervenant@example.com',
      isBureau: false,
      isIntervenant: true,
    });

    expect(() => guard.canActivate(context)).toThrow(
      new ForbiddenException('Accès réservé au Bureau'),
    );
  });

  it('should reject a user without active roles', () => {
    const context = createContext({
      id: 4,
      email: 'inactive@example.com',
      isBureau: false,
      isIntervenant: false,
    });

    expect(() => guard.canActivate(context)).toThrow(
      new ForbiddenException('Accès réservé au Bureau'),
    );
  });

  it('should reject a request without an authenticated user', () => {
    const context = createContext();

    expect(() => guard.canActivate(context)).toThrow(
      new ForbiddenException('Accès réservé au Bureau'),
    );
  });

  it('should reject a user without the isBureau property', () => {
    const context = createContext({
      id: 5,
      email: 'unknown@example.com',
      isIntervenant: true,
    });

    expect(() => guard.canActivate(context)).toThrow(
      new ForbiddenException('Accès réservé au Bureau'),
    );
  });
});
