import { IsDateString, IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class CreateIntervenantDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  email: string;

  @IsDateString()
  schoolEndDate: string;
}