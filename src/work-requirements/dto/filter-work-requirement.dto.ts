import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Priority } from '../enums/priority.enum';
import { WorkRequirementStatus } from '../enums/work-requirement-status.enum';

export class FilterWorkRequirementDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsEnum(WorkRequirementStatus)
  status?: WorkRequirementStatus;
}
