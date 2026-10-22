import { PartialType } from '@nestjs/mapped-types';
import { CreateMissionDto } from './create-mission.dto.js';

export class UpdateMissionDto extends PartialType(CreateMissionDto) {}