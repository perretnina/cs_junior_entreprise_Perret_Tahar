import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';
import { getAccess, getAccessError } from './access-validity.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { intervenant: true },
    });

    if (!user || !(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    const access = getAccess(user);
    const authorized = dto.activeSpace === 'bureau' ? access.isBureau : access.isIntervenant;

    if (!authorized) {
      throw new UnauthorizedException(getAccessError(user, dto.activeSpace));
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      activeSpace: dto.activeSpace,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        ...access,
        intervenantId: user.intervenant?.id ?? null,
      },
    };
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { intervenant: true },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }

    return {
      id: user.id,
      email: user.email,
      ...getAccess(user),
      intervenantId: user.intervenant?.id ?? null,
      firstName: user.intervenant?.firstName ?? null,
      lastName: user.intervenant?.lastName ?? null,
      schoolEndDate: user.intervenant?.schoolEndDate ?? null,
      bureauValidUntil: user.bureauValidUntil,
    };
  }
}
