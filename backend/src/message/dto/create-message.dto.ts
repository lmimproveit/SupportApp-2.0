import {
  IsInt,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsInt()
  ticketId!: number;

  @IsInt()
  userId!: number;
}
