import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Vendor } from '../../vendors/entities/vendor.entity';
import { DocumentType } from '../enums/document-type.enum';

@Entity('vendor_documents')
export class VendorDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ name: 'vendor_id', type: 'integer' })
  vendorId: number;

  @ManyToOne(() => Vendor, (vendor) => vendor.documents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @Column({
    name: 'document_type',
    type: 'enum',
    enum: DocumentType,
  })
  documentType: DocumentType;

  @Column({ name: 'document_number', type: 'varchar', length: 255 })
  documentNumber: string;

  @Column({ name: 'issuing_authority', type: 'varchar', length: 255 })
  issuingAuthority: string;

  @Column({ name: 'issue_date', type: 'date' })
  issueDate: string;

  @Column({ name: 'expiry_date', type: 'date' })
  expiryDate: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string | null;
}
