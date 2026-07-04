import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

// Hierarquia: quem está acima herda as permissões de quem está abaixo.
const HIERARCHY: Role[] = [
  Role.VISITANTE,
  Role.MEMBRO,
  Role.VICE_LIDER,
  Role.LIDER,
  Role.PASTOR,
  Role.ADMIN,
];

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;

    const userRank = HIERARCHY.indexOf(user.role as Role);
    return required.some((role) => userRank >= HIERARCHY.indexOf(role));
  }
}
