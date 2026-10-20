import { Body, Controller, ForbiddenException, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const cookieName = 'supportapp_session';
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 1000,
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() body: RegisterDto) {
    if (process.env.ENABLE_PUBLIC_REGISTRATION !== 'true') throw new ForbiddenException('Public registration is disabled');
    return this.authService.register(body.email, body.password, body.firstName, body.lastName, body.companyId);
  }

  @Post('login')
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(body.email, body.password);
    res.cookie(cookieName, result.accessToken, cookieOptions);
    return { user: result.user };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: Request & { user: { userId: number } }) {
    return { user: await this.authService.getSafeUser(req.user.userId) };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(cookieName, { path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
    return { ok: true };
  }
}
