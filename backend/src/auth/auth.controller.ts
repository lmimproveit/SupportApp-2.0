import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(
    @Body()
    body: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      companyId: number;
    },
  ) {
    return this.authService.register(
      body.email,
      body.password,
      body.firstName,
      body.lastName,
      body.companyId,
    );
  }

  @Post('login')
  login(
    @Body()
    body: {
      email: string;
      password: string;
    },
  ) {
    return this.authService.login(body.email, body.password);
  }
}