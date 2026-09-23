import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '../../generated/prisma/client';
import { UserService } from './user.service';

describe('UserService', () => {
  const prisma = {
    company: { findUnique: jest.fn() },
    user: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  };
  let service: UserService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UserService(prisma as any);
  });

  it('scopes user lists to the authenticated company', async () => {
    prisma.user.findMany.mockResolvedValue([]);
    await service.findAll(4);
    expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { companyId: 4 } }));
  });

  it('blocks a USER from viewing another profile', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 3, companyId: 1 });
    await expect(service.findOne(3, 4, UserRole.USER, 1)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('blocks cross-company user reads', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 3, companyId: 1 });
    await expect(service.findOne(3, 5, UserRole.SUPPORT, 4)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('prevents moving a user to another company', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 3, companyId: 1 });
    await expect(service.update(3, { companyId: 4 }, 1)).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
