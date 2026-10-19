import { IsDateString, IsEmail, IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class UpdateIntervenantDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  firstName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsDateString()
  schoolEndDate?: string;
}