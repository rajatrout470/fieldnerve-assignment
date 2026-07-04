import { Injectable, Logger } from '@nestjs/common';
import { AiSummaryRepository } from './ai-summary.repository';
import { AiSummary } from './entities/ai-summary.entity';
import { AiSummarySource } from './enums/ai-summary-source.enum';
import { SummaryInput } from './interfaces/summary-input.interface';
import { SummaryGenerationResult } from './interfaces/summary-provider.interface';
import { LlmSummaryProvider } from './providers/llm-summary.provider';
import { FallbackSummaryProvider } from './providers/fallback-summary.provider';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly llmSummaryProvider: LlmSummaryProvider,
    private readonly fallbackSummaryProvider: FallbackSummaryProvider,
    private readonly aiSummaryRepository: AiSummaryRepository,
  ) {}

  async generateAndPersistSummary(
    recommendationId: string,
    input: SummaryInput,
  ): Promise<AiSummary> {
    const { result, source } = await this.generateSummary(input);

    return this.aiSummaryRepository.createSummary({
      recommendationId,
      summaryText: result.summaryText,
      source,
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      generationTimeMs: result.generationTimeMs,
    });
  }

  private async generateSummary(
    input: SummaryInput,
  ): Promise<{ result: SummaryGenerationResult; source: AiSummarySource }> {
    if (!process.env.GEMINI_API_KEY) {
      return {
        result: await this.fallbackSummaryProvider.generate(input),
        source: AiSummarySource.FALLBACK,
      };
    }

    try {
      const result = await this.llmSummaryProvider.generate(input);
      return { result, source: AiSummarySource.LLM };
    } catch (error) {
      this.logger.warn(
        `LLM summary generation failed, falling back to templated summary: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return {
        result: await this.fallbackSummaryProvider.generate(input),
        source: AiSummarySource.FALLBACK,
      };
    }
  }
}
