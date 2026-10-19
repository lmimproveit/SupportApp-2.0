import { Body, Controller, ForbiddenException, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }
}
