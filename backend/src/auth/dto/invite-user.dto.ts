import { IsEmail, IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { UserRole } from '../../../generated/prisma/client';

export class InviteUserDto {
  @IsEmail() email: string;
  @IsString() @IsNotEmpty() @MaxLength(100) firstName: string;
  @IsString() @IsNotEmpty() @MaxLength(100) lastName: string;
  @IsEnum(UserRole) role: UserRole;
}
