import { UserRole } from '../../../generated/prisma/enums';

export class UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  companyId?: number;
}