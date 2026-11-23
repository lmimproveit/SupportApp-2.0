jest.mock('@nestjs/passport', () => ({ AuthGuard: () => class {} }));
jest.mock('@nestjs/jwt', () => ({ JwtService: class JwtService {} }));

import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { InvitationService } from './invitation.service';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: InvitationService, useValue: { invite: jest.fn(), accept: jest.fn() } },
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
