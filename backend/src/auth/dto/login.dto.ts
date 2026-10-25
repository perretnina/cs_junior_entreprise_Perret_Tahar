import { IsEmail, IsString, IsNotEmpty, IsIn } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsIn(['bureau', 'intervenant'])
  activeSpace!: 'bureau' | 'intervenant';
}