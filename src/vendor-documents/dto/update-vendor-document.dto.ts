import { OmitType, PartialType } from '@nestjs/mapped-types';
import { IsUUID } from 'class-validator';
import { CreateVendorDocumentDto } from './create-vendor-document.dto';

export class UpdateVendorDocumentDto extends PartialType(
  OmitType(CreateVendorDocumentDto, ['createdBy', 'vendorId'] as const),
) {
  @IsUUID()
  updatedBy: string;
}
