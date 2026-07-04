import { SummaryInput } from './summary-input.interface';

export interface SummaryGenerationResult {
  summaryText: string;
  model: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  generationTimeMs: number;
}

export interface SummaryProvider {
  generate(input: SummaryInput): Promise<SummaryGenerationResult>;
}
