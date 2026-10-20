import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

const fromCookie = (request: Request): string | null => {
  const header = request?.headers?.cookie;
  const match = header?.split(';').map(v => v.trim()).find(v => v.startsWith('supportapp_session='));
  return match ? decodeURIComponent(match.slice('supportapp_session='.length)) : null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService, private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([fromCookie, ExtractJwt.fromAuthHeaderAsBearerToken()]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: number }) {
    if (!Number.isInteger(payload.sub)) throw new UnauthorizedException();
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, companyId: true },
    });
    if (!user) throw new UnauthorizedException();
    return { userId: user.id, email: user.email, role: user.role, companyId: user.companyId };
  }
}
