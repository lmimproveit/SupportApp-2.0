import {
  IsInt,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsInt()
  userId!: number;

  @IsInt()
  companyId!: number;
}