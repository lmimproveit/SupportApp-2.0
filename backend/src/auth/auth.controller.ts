import { Body, Controller, ForbiddenException, Post, Req, UseGuards } from '@nestjs/common';
import { InvitationService } from './invitation.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { JwtAuthGuard } from './jwt-auth/jwt-auth.guard';
import { RolesGuard } from './roles/roles.guard';
import { Roles } from './roles/roles.decorator';
import { UserRole } from '../../generated/prisma/client';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly invitationService: InvitationService) {}

  @Post('register')
  register(@Body() body: RegisterDto) {
    if (process.env.ENABLE_PUBLIC_REGISTRATION !== 'true') throw new ForbiddenException('Public registration is disabled');
    return this.authService.register(
      body.email,
      body.password,
      body.firstName,
      body.lastName,
      body.companyId,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('invite')
  invite(@Body() body: InviteUserDto, @Req() req: any) {
    return this.invitationService.invite(body,req.user.companyId,req.user.userId);
  }

  @Post('accept-invitation')
  acceptInvitation(@Body() body: AcceptInvitationDto) {
    return this.invitationService.accept(body.token,body.password);
  }

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }
}
