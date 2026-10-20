import { UnauthorizedException } from '@nestjs/common';

jest.mock('@nestjs/passport', () => ({
  PassportStrategy: () => class {},
}));

jest.mock('passport-jwt', () => ({
  ExtractJwt: { fromAuthHeaderAsBearerToken: () => () => null },
  Strategy: class {},
}));

import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const configService = { getOrThrow: jest.fn().mockReturnValue('test-jwt-secret') };
  const prisma = { user: { findUnique: jest.fn() } };
  let strategy: JwtStrategy;

  beforeEach(() => {
    jest.clearAllMocks();
    strategy = new JwtStrategy(configService as any, prisma as any);
  });

  it('uses the current role and company from the database, not stale token claims', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 7,
      email: 'admin@example.com',
      role: 'USER',
      companyId: 2,
    });

    await expect(
      strategy.validate({ sub: 7, role: 'ADMIN', companyId: 1 } as any),
    ).resolves.toEqual({
      userId: 7,
      email: 'admin@example.com',
      role: 'USER',
      companyId: 2,
    });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 7 },
      select: { id: true, email: true, role: true, companyId: true },
    });
  });

  it('rejects a token for a deleted user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(strategy.validate({ sub: 7 })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects an invalid subject before querying the database', async () => {
    await expect(strategy.validate({ sub: NaN })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
});
