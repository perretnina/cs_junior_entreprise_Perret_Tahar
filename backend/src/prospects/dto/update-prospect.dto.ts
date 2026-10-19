import { PartialType } from '@nestjs/mapped-types';
import { CreateProspectDto } from './create-prospect.dto.js';

export class UpdateProspectDto extends PartialType(CreateProspectDto) {}
