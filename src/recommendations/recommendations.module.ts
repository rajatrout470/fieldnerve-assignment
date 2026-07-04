import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Recommendation } from './entities/recommendation.entity';
import { RecommendationResult } from './entities/recommendation-result.entity';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';
import { RecommendationsRepository } from './recommendations.repository';
import { VendorsModule } from '../vendors/vendors.module';
import { VendorDocumentsModule } from '../vendor-documents/vendor-documents.module';
import { WorkRequirementsModule } from '../work-requirements/work-requirements.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Recommendation, RecommendationResult]),
    VendorsModule,
    VendorDocumentsModule,
    WorkRequirementsModule,
    AiModule,
  ],
  controllers: [RecommendationsController],
  providers: [RecommendationsService, RecommendationsRepository],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
