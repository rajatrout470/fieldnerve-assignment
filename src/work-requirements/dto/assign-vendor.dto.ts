import { IsInt, IsPositive, IsUUID } from 'class-validator';

export class AssignVendorDto {
  @IsInt()
  @IsPositive()
  vendorId: number;

  @IsUUID()
  updatedBy: string;
}
