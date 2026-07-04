import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Recommendation } from './recommendation.entity';
import { ScoreBreakdown } from '../interfaces/score-breakdown.interface';
import { decimalTransformer } from '../utils/decimal-transformer';

@Entity('recommendation_results')
export class RecommendationResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'recommendation_id', type: 'uuid' })
  recommendationId: string;

  @ManyToOne(() => Recommendation, (recommendation) => recommendation.results, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'recommendation_id' })
  recommendation: Recommendation;

  // Plain FK column (no ORM relation) — vendors are owned by the vendors module.
  @Index()
  @Column({ name: 'vendor_id', type: 'integer' })
  vendorId: number;

  @Column({
    name: 'total_score',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  totalScore: number | null;

  @Column({ type: 'integer', nullable: true })
  rank: number | null;

  @Column({ name: 'score_breakdown', type: 'jsonb', nullable: true })
  scoreBreakdown: ScoreBreakdown | null;

  @Column({ type: 'boolean', default: false })
  excluded: boolean;

  @Column({
    name: 'excluded_reason',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  excludedReason: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
