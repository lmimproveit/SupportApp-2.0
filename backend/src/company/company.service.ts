import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompanyService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: number, currentCompanyId: number) {
    if (id !== currentCompanyId) {
      throw new ForbiddenException('You do not have permission to view this company');
    }

    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async update(
    id: number,
    updateCompanyDto: UpdateCompanyDto,
    currentCompanyId: number,
  ) {
    await this.findOne(id, currentCompanyId);
    return this.prisma.company.update({
      where: { id },
      data: updateCompanyDto,
    });
  }

  async remove(id: number, currentCompanyId: number) {
    await this.findOne(id, currentCompanyId);
    return this.prisma.company.delete({ where: { id } });
  }
}
