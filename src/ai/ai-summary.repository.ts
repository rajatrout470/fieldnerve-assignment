import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { AiSummary } from './entities/ai-summary.entity';

@Injectable()
export class AiSummaryRepository extends Repository<AiSummary> {
  constructor(private readonly dataSource: DataSource) {
    super(AiSummary, dataSource.createEntityManager());
  }

  async createSummary(data: Partial<AiSummary>): Promise<AiSummary> {
    const summary = this.create(data);
    return this.save(summary);
  }
}
