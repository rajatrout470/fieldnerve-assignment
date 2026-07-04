import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { VendorStatus } from '../enums/vendor-status.enum';

export class CreateVendorDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsString()
  @MaxLength(255)
  category: string;

  @IsEmail()
  email: string;

  @IsPhoneNumber()
  phone: string;

  @IsString()
  @MaxLength(255)
  operatingLocation: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(9.99)
  rating?: number;

  @IsOptional()
  @IsEnum(VendorStatus)
  status?: VendorStatus;

  @IsUUID()
  createdBy: string;
}
