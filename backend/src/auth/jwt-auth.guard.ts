import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';
import { getAccess, getAccessError } from './access-validity.js';

export interface AuthenticatedUser {
  id: number;
  email: string;
  isBureau: boolean;
  isIntervenant: boolean;
  activeSpace: 'bureau' | 'intervenant';
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token manquant');
    }

    const token = authorization.slice(7);
    let payload: { sub: number; activeSpace: 'bureau' | 'intervenant' };

    try {
      payload = await this.jwtService.verifyAsync<{
        sub: number;
        activeSpace: 'bureau' | 'intervenant';
      }>(token);
    } catch {
      throw new UnauthorizedException('Token invalide ou expiré');
    }

    if (!Number.isInteger(payload.sub)) {
      throw new UnauthorizedException('Token invalide');
    }

    if (payload.activeSpace !== 'bureau' && payload.activeSpace !== 'intervenant') {
      throw new UnauthorizedException('Espace invalide');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { intervenant: true },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }

    const access = getAccess(user);
    const authorized = payload.activeSpace === 'bureau' ? access.isBureau : access.isIntervenant;

    if (!authorized) {
      throw new UnauthorizedException(getAccessError(user, payload.activeSpace));
    }

    request.user = {
      id: user.id,
      email: user.email,
      ...access,
      activeSpace: payload.activeSpace,
    };

    return true;
  }
}
