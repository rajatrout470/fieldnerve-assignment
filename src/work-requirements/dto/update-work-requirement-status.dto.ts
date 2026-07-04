import { IsEnum, IsUUID } from 'class-validator';
import { WorkRequirementStatus } from '../enums/work-requirement-status.enum';

export class UpdateWorkRequirementStatusDto {
  @IsEnum(WorkRequirementStatus)
  status: WorkRequirementStatus;

  @IsUUID()
  updatedBy: string;
}
