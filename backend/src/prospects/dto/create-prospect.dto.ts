
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  Domaine,
  StatutProspect,
} from '../../generated/prisma/enums.js';

export class CreateProspectDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsEmail()
  email?: string | null;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @IsEnum(Domaine)
  domain!: Domaine;

  @IsOptional()
  @IsEnum(StatutProspect)
  status?: StatutProspect;
}
