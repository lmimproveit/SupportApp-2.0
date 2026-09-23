import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
jest.mock('@nestjs/jwt', () => ({ JwtService: class JwtService {} }));

import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({ hash: jest.fn(), compare: jest.fn() }));

describe('AuthService', () => {
  const prisma = {
    user: { findUnique: jest.fn(), create: jest.fn() },
    company: { findUnique: jest.fn() },
  };
  const jwtService = { signAsync: jest.fn() };
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(prisma as any, jwtService as any);
  });

  it('normalizes email and omits password on register', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.company.findUnique.mockResolvedValue({ id: 1 });
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
    prisma.user.create.mockResolvedValue({ id: 3, email: 'test@example.com', password: 'hashed', companyId: 1, role: 'USER' });

    const result = await service.register(' Test@Example.COM ', 'Test12345!', 'Test', 'User', 1);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
    expect(result).not.toHaveProperty('password');
  });

  it('rejects duplicate emails', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1 });
    await expect(service.register('test@example.com', 'Test12345!', 'Test', 'User', 1)).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects an invalid password without signing a token', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 3, email: 'test@example.com', password: 'hashed', role: 'USER', companyId: 1 });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    await expect(service.login('test@example.com', 'Wrong123!')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('signs tenant and role claims on login', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 3, email: 'test@example.com', password: 'hashed', role: 'SUPPORT', companyId: 1 });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    jwtService.signAsync.mockResolvedValue('token');

    const result = await service.login(' Test@Example.COM ', 'Test12345!');

    expect(jwtService.signAsync).toHaveBeenCalledWith({ sub: 3, email: 'test@example.com', role: 'SUPPORT', companyId: 1 });
    expect(result.user).not.toHaveProperty('password');
  });
});
