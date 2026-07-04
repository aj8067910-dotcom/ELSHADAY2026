import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private gamification: GamificationService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('E-mail já cadastrado.');

    const church = await this.prisma.church.findUnique({
      where: { slug: dto.churchSlug ?? 'elshaday' },
    });
    if (!church)
      throw new NotFoundException('Igreja não encontrada. Rode as seeds.');

    const user = await this.prisma.user.create({
      data: {
        churchId: church.id,
        name: dto.name,
        email: dto.email,
        passwordHash: await bcrypt.hash(dto.password, 10),
        nickname: dto.nickname,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        phone: dto.phone,
        city: dto.city,
        teamId: dto.teamId || undefined,
        leaderId: dto.leaderId || undefined,
        streak: { create: {} },
      },
    });

    await this.gamification.grantBadge(user.id, 'bem-vindo');
    return this.issueTokens(user.id, user.churchId, user.role, user.email);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }
    return this.issueTokens(user.id, user.churchId, user.role, user.email);
  }

  async refresh(refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = this.jwt.verify<JwtPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido.');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (
      !user?.refreshTokenHash ||
      !(await bcrypt.compare(refreshToken, user.refreshTokenHash))
    ) {
      throw new UnauthorizedException('Sessão expirada. Faça login novamente.');
    }
    return this.issueTokens(user.id, user.churchId, user.role, user.email);
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
    return { ok: true };
  }

  private async issueTokens(
    sub: string,
    churchId: string,
    role: string,
    email: string,
  ) {
    const payload: JwtPayload = { sub, churchId, role, email };
    const accessToken = this.jwt.sign(payload, {
      secret: process.env.JWT_SECRET ?? 'dev-secret',
      expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
    });
    const refreshToken = this.jwt.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    });
    await this.prisma.user.update({
      where: { id: sub },
      data: { refreshTokenHash: await bcrypt.hash(refreshToken, 10) },
    });
    return { accessToken, refreshToken };
  }
}
