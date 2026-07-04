import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RecommendationResult } from './recommendation-result.entity';
import { AiSummary } from '../../ai/entities/ai-summary.entity';

@Entity('recommendations')
export class Recommendation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Plain FK column (no ORM relation), matching this codebase's existing
  // convention for cross-module id references (see WorkRequirement.assignedVendorId).
  @Index()
  @Column({ name: 'work_requirement_id', type: 'integer' })
  workRequirementId: number;

  @Column({ name: 'total_vendors_evaluated', type: 'integer' })
  totalVendorsEvaluated: number;

  @OneToMany(() => RecommendationResult, (result) => result.recommendation, {
    cascade: true,
  })
  results: RecommendationResult[];

  @OneToOne(() => AiSummary, (summary) => summary.recommendation, {
    nullable: true,
    cascade: true,
  })
  aiSummary: AiSummary | null;

  @CreateDateColumn({ name: 'generated_at', type: 'timestamp' })
  generatedAt: Date;
}
