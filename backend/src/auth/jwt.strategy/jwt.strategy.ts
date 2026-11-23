import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService, private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: {
    sub: number;
    email: string;
    role: string;
    companyId: number;
  }) {
    if (!Number.isSafeInteger(payload.sub) || payload.sub <= 0) {
      throw new UnauthorizedException('Invalid session');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, companyId: true },
    });
    if (!user) throw new UnauthorizedException('User no longer exists');
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    };
  }
}
