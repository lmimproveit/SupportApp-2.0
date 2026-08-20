import { UserRole } from '../../../generated/prisma/enums';

export class CreateUserDto {
  email!: string;
  firstName!: string;
  lastName!: string;
  role?: UserRole;
  companyId!: number;
}