import {
  IsDateString,
  IsEnum,
  IsInt,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { DocumentType } from '../enums/document-type.enum';

export class CreateVendorDocumentDto {
  @IsInt()
  @IsPositive()
  vendorId: number;

  @IsEnum(DocumentType)
  documentType: DocumentType;

  @IsString()
  @MaxLength(255)
  documentNumber: string;

  @IsString()
  @MaxLength(255)
  issuingAuthority: string;

  @IsDateString()
  issueDate: string;

  @IsDateString()
  expiryDate: string;

  @IsUUID()
  createdBy: string;
}
