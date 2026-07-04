import { IsEnum, IsUUID } from 'class-validator';
import { VendorStatus } from '../enums/vendor-status.enum';

export class UpdateVendorStatusDto {
  @IsEnum(VendorStatus)
  status: VendorStatus;

  @IsUUID()
  updatedBy: string;
}
