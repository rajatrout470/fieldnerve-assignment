import { PartialType, OmitType } from '@nestjs/mapped-types';
import { IsUUID } from 'class-validator';
import { CreateVendorDto } from './create-vendor.dto';

export class UpdateVendorDto extends PartialType(
  OmitType(CreateVendorDto, ['createdBy'] as const),
) {
  @IsUUID()
  updatedBy: string;
}
