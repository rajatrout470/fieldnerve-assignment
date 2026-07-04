import { OmitType, PartialType } from '@nestjs/mapped-types';
import { IsUUID } from 'class-validator';
import { CreateWorkRequirementDto } from './create-work-requirement.dto';

export class UpdateWorkRequirementDto extends PartialType(
  OmitType(CreateWorkRequirementDto, ['createdBy'] as const),
) {
  @IsUUID()
  updatedBy: string;
}
