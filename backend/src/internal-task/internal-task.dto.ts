import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { InternalTaskPriority, TicketStatus } from '../../generated/prisma/client';

export class CreateInternalTaskDto {
  @IsString() @IsNotEmpty() @MaxLength(120) title!: string;
  @IsString() @IsNotEmpty() description!: string;
  @IsOptional() @IsString() @MaxLength(200) customerName?: string;
  @IsOptional() @IsEnum(InternalTaskPriority) priority?: InternalTaskPriority;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsInt() assignedToId?: number;
}

export class UpdateInternalTaskDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(120) title?: string;
  @IsOptional() @IsString() @IsNotEmpty() description?: string;
  @IsOptional() @IsString() @MaxLength(200) customerName?: string;
  @IsOptional() @IsEnum(InternalTaskPriority) priority?: InternalTaskPriority;
  @IsOptional() @IsEnum(TicketStatus) status?: TicketStatus;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsInt() assignedToId?: number;
}
