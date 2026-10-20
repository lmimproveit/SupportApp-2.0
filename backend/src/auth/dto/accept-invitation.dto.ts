import { IsString, MinLength, MaxLength } from 'class-validator';
export class AcceptInvitationDto {
  @IsString() token: string;
  @IsString() @MinLength(12) @MaxLength(128) password: string;
}
