import {
  IsDateString,
  IsEnum,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Priority } from '../enums/priority.enum';

export class CreateWorkRequirementDto {
  @IsString()
  @MaxLength(255)
  title: string;

  @IsString()
  @MaxLength(255)
  category: string;

  @IsString()
  @MaxLength(255)
  location: string;

  @IsString()
  @MaxLength(255)
  estimatedValue: string;

  @IsEnum(Priority)
  priority: Priority;

  @IsDateString()
  expectedStartDate: string;

  @IsUUID()
  createdBy: string;
}
