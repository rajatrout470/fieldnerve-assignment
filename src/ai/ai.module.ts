import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiSummary } from './entities/ai-summary.entity';
import { AiService } from './ai.service';
import { AiSummaryRepository } from './ai-summary.repository';
import { LlmSummaryProvider } from './providers/llm-summary.provider';
import { FallbackSummaryProvider } from './providers/fallback-summary.provider';

@Module({
  imports: [TypeOrmModule.forFeature([AiSummary])],
  providers: [
    AiService,
    AiSummaryRepository,
    LlmSummaryProvider,
    FallbackSummaryProvider,
  ],
  exports: [AiService],
})
export class AiModule {}
