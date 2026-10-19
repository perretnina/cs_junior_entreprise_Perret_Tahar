import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { AuthenticatedRequest } from './jwt-auth.guard.js';

@Injectable()
export class BureauGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request =
      context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user?.isBureau) {
      throw new ForbiddenException('Accès réservé au Bureau');
    }

    return true;
  }
}