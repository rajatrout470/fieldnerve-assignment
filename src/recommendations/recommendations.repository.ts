import { Injectable } from '@nestjs/common';
import { DataSource, DeepPartial, Repository } from 'typeorm';
import { Recommendation } from './entities/recommendation.entity';

@Injectable()
export class RecommendationsRepository extends Repository<Recommendation> {
  constructor(private readonly dataSource: DataSource) {
    super(Recommendation, dataSource.createEntityManager());
  }

  async createRecommendation(
    data: DeepPartial<Recommendation>,
  ): Promise<Recommendation> {
    const recommendation = this.create(data);
    return this.save(recommendation);
  }

  async findLatestByWorkRequirement(
    workRequirementId: number,
  ): Promise<Recommendation | null> {
    return this.findOne({
      where: { workRequirementId },
      order: { generatedAt: 'DESC' },
      relations: { results: true, aiSummary: true },
    });
  }
}
