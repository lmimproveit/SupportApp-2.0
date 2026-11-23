import { BadRequestException, ConflictException } from '@nestjs/common';
import { UserRole } from '../../generated/prisma/client';
import { InvitationService } from './invitation.service';

describe('InvitationService', () => {
  const originalFrontendUrl = process.env.FRONTEND_URL;
  const originalCorsOrigin = process.env.CORS_ORIGIN;
  const prisma = {
    user: { findUnique: jest.fn(), create: jest.fn() },
    userInvitation: { create: jest.fn(), findUnique: jest.fn(), updateMany: jest.fn() },
    $transaction: jest.fn(),
  };
  const service = new InvitationService(prisma as any);

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.FRONTEND_URL = 'https://support.example.com';
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.userInvitation.create.mockResolvedValue({ id: 1 });
  });

  afterAll(() => {
    if (originalFrontendUrl === undefined) delete process.env.FRONTEND_URL;
    else process.env.FRONTEND_URL = originalFrontendUrl;
    if (originalCorsOrigin === undefined) delete process.env.CORS_ORIGIN;
    else process.env.CORS_ORIGIN = originalCorsOrigin;
  });

  it('creates a hashed, expiring invitation and returns a secure link', async () => {
    const result = await service.invite({
      email: ' LM@Example.com ', firstName: 'LM', lastName: 'Admin', role: UserRole.ADMIN,
    }, 1, 7);
    expect(result.email).toBe('lm@example.com');
    expect(result.inviteUrl).toMatch(/^https:\/\/support\.example\.com\/\?invite=[a-f0-9]{64}$/);
    const data = prisma.userInvitation.create.mock.calls[0][0].data;
    expect(data.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(data.tokenHash).not.toBe(result.inviteUrl.split('invite=')[1]);
    expect(data.companyId).toBe(1);
    expect(data.issuedById).toBe(7);
    expect(data.role).toBe(UserRole.ADMIN);
    expect(data.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('rejects invitations for registered users', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 9 });
    await expect(service.invite({
      email: 'existing@example.com', firstName: 'Test', lastName: 'User', role: UserRole.USER,
    }, 1, 7)).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects expired invitations', async () => {
    prisma.userInvitation.findUnique.mockResolvedValue({
      id: 1, acceptedAt: null, expiresAt: new Date(Date.now() - 1000),
    });
    await expect(service.accept('a'.repeat(64), 'strong-password-123'))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an already consumed invitation', async () => {
    prisma.userInvitation.findUnique.mockResolvedValue({
      id: 1, acceptedAt: null, expiresAt: new Date(Date.now() + 60000),
    });
    prisma.$transaction.mockImplementation(async (callback: any) => callback({
      userInvitation: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
      user: { create: jest.fn() },
    }));
    await expect(service.accept('a'.repeat(64), 'strong-password-123'))
      .rejects.toBeInstanceOf(BadRequestException);
  });
});
