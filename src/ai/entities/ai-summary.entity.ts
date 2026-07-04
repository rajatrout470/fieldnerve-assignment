import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Recommendation } from '../../recommendations/entities/recommendation.entity';
import { AiSummarySource } from '../enums/ai-summary-source.enum';

@Entity('ai_summaries')
export class AiSummary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'recommendation_id', type: 'uuid', unique: true })
  recommendationId: string;

  @OneToOne(
    () => Recommendation,
    (recommendation) => recommendation.aiSummary,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'recommendation_id' })
  recommendation: Recommendation;

  @Column({ name: 'summary_text', type: 'text' })
  summaryText: string;

  @Column({ type: 'enum', enum: AiSummarySource })
  source: AiSummarySource;

  @Column({ type: 'varchar', length: 100, nullable: true })
  model: string | null;

  @Column({ name: 'input_tokens', type: 'integer', nullable: true })
  inputTokens: number | null;

  @Column({ name: 'output_tokens', type: 'integer', nullable: true })
  outputTokens: number | null;

  @Column({ name: 'generation_time_ms', type: 'integer', nullable: true })
  generationTimeMs: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
