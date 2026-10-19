import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private getBureauAccess(user: {
    isBureau: boolean;
    bureauValidUntil: Date | null;
  }) {
    return (
      user.isBureau &&
      user.bureauValidUntil !== null &&
      user.bureauValidUntil >= new Date()
    );
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { intervenant: true },
    });

    if (!user || !(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    const isBureau = this.getBureauAccess(user);

    if (!isBureau && !user.isIntervenant) {
      throw new UnauthorizedException('Aucun accès actif');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        isBureau,
        isIntervenant: user.isIntervenant,
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
      isBureau: this.getBureauAccess(user),
      isIntervenant: user.isIntervenant,
      intervenantId: user.intervenant?.id ?? null,
      firstName: user.intervenant?.firstName ?? null,
      lastName: user.intervenant?.lastName ?? null,
      schoolEndDate: user.intervenant?.schoolEndDate ?? null,
      bureauValidUntil: user.bureauValidUntil,
    };
  }
}
