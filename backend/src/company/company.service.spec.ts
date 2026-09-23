import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CompanyService } from './company.service';

describe('CompanyService', () => {
  const prisma = { company: { findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() } };
  let service: CompanyService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CompanyService(prisma as any);
  });

  it('returns the authenticated users company', async () => {
    const company = { id: 1, name: 'Testbolaget AB' };
    prisma.company.findUnique.mockResolvedValue(company);
    await expect(service.findOne(1, 1)).resolves.toEqual(company);
  });

  it('blocks cross-company reads', async () => {
    await expect(service.findOne(1, 4)).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.company.findUnique).not.toHaveBeenCalled();
  });

  it('returns not found when the current company does not exist', async () => {
    prisma.company.findUnique.mockResolvedValue(null);
    await expect(service.findOne(1, 1)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('blocks cross-company updates', async () => {
    await expect(service.update(1, { name: 'Changed' }, 4)).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.company.update).not.toHaveBeenCalled();
  });
});
