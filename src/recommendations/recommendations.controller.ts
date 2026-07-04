import { Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { Recommendation } from './entities/recommendation.entity';

@Controller('work-requirements/:workRequirementId/recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
  ) {}

  @Post()
  generate(
    @Param('workRequirementId', ParseIntPipe) workRequirementId: number,
  ): Promise<Recommendation> {
    return this.recommendationsService.generateRecommendation(
      workRequirementId,
    );
  }

  @Get()
  getLatest(
    @Param('workRequirementId', ParseIntPipe) workRequirementId: number,
  ): Promise<Recommendation> {
    return this.recommendationsService.getLatestRecommendation(
      workRequirementId,
    );
  }
}
