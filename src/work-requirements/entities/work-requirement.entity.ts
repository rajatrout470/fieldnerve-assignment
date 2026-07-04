import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Priority } from '../enums/priority.enum';
import { WorkRequirementStatus } from '../enums/work-requirement-status.enum';

@Entity('work_requirements')
export class WorkRequirement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 255 })
  category: string;

  @Column({ type: 'varchar', length: 255 })
  location: string;

  @Column({ name: 'estimated_value', type: 'varchar', length: 255 })
  estimatedValue: string;

  @Index()
  @Column({ type: 'enum', enum: Priority })
  priority: Priority;

  @Column({ name: 'expected_start_date', type: 'date' })
  expectedStartDate: string;

  @Index()
  @Column({
    type: 'enum',
    enum: WorkRequirementStatus,
    default: WorkRequirementStatus.OPEN,
  })
  status: WorkRequirementStatus;

  // Not part of the original column spec, but required to back assignVendor() —
  // no formal relation to Vendor to keep this module independent of vendors.
  @Index()
  @Column({ name: 'assigned_vendor_id', type: 'integer', nullable: true })
  assignedVendorId: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string | null;
}
