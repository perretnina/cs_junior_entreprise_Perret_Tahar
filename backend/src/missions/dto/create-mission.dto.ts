import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

import { Domaine, StatutMission } from '../../generated/prisma/enums.js';

export class CreateMissionDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsDateString()
  signedAt?: string | null;

  @IsEnum(StatutMission)
  status: StatutMission;

  @IsEnum(Domaine)
  domain: Domaine;

  @IsInt()
  @IsPositive()
  prospectId: number;

  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  intervenantIds: number[];
}