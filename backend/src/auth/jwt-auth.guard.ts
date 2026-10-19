import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';

export interface AuthenticatedUser {
  id: number;
  email: string;
  isBureau: boolean;
  isIntervenant: boolean;
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
    const request =
      context.switchToHttp().getRequest<AuthenticatedRequest>();

    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token manquant');
    }

    const token = authorization.slice(7);

    let payload: { sub: number };

    try {
      payload = await this.jwtService.verifyAsync<{ sub: number }>(
        token,
      );
    } catch {
      throw new UnauthorizedException('Token invalide ou expiré');
    }

    if (!Number.isInteger(payload.sub)) {
      throw new UnauthorizedException('Token invalide');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }

    const isBureau =
      user.isBureau &&
      user.bureauValidUntil !== null &&
      user.bureauValidUntil >= new Date();

    if (!isBureau && !user.isIntervenant) {
      throw new UnauthorizedException('Aucun accès actif');
    }

    request.user = {
      id: user.id,
      email: user.email,
      isBureau,
      isIntervenant: user.isIntervenant,
    };

    return true;
  }
}