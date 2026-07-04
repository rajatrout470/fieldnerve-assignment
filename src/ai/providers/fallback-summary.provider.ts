import { Injectable } from '@nestjs/common';
import {
  SummaryInput,
  SummaryInputExcludedVendor,
  SummaryInputVendorResult,
} from '../interfaces/summary-input.interface';
import {
  SummaryGenerationResult,
  SummaryProvider,
} from '../interfaces/summary-provider.interface';

const SCORE_BREAKDOWN_LABELS: Record<string, string> = {
  categoryMatch: 'category match',
  locationMatch: 'location match',
  rating: 'rating',
  compliance: 'compliance completeness',
  priorityFit: 'priority fit',
};

const CLOSE_SCORE_THRESHOLD = 5;
const EXPIRY_RISK_WINDOW_DAYS = 30;
const TOP_RESULTS_TO_CHECK_FOR_RISK = 3;

@Injectable()
export class FallbackSummaryProvider implements SummaryProvider {
  generate(input: SummaryInput): Promise<SummaryGenerationResult> {
    const start = Date.now();
    const summaryText = this.buildSummary(input);
    return Promise.resolve({
      summaryText,
      model: null,
      inputTokens: null,
      outputTokens: null,
      generationTimeMs: Date.now() - start,
    });
  }

  private buildSummary(input: SummaryInput): string {
    const {
      includedResults,
      excludedResults,
      totalVendorsEvaluated,
      workRequirement,
    } = input;

    if (includedResults.length === 0) {
      const reason = this.mostCommonReason(excludedResults);
      const reasonText = reason
        ? ` The most common reason was: ${reason.toLowerCase()}.`
        : '';
      return (
        `No vendors passed the eligibility filters for "${workRequirement.title}" out of ` +
        `${totalVendorsEvaluated} vendors evaluated.${reasonText} Review vendor eligibility or ` +
        'expand the candidate pool before proceeding.'
      );
    }

    const sentences: string[] = [];
    const top = includedResults[0];
    const topFactor = this.topFactor(top.scoreBreakdown);
    sentences.push(
      `${top.vendorName} is the top-ranked vendor for "${workRequirement.title}" with a total score of ` +
        `${top.totalScore} out of 100, driven primarily by its ${topFactor.label} score of ${topFactor.value}.`,
    );

    const runnerUp = includedResults[1];
    if (
      runnerUp &&
      top.totalScore - runnerUp.totalScore <= CLOSE_SCORE_THRESHOLD
    ) {
      sentences.push(
        `${runnerUp.vendorName} is a close alternative at ${runnerUp.totalScore}, within ` +
          `${(top.totalScore - runnerUp.totalScore).toFixed(2)} points of the top choice, so the ` +
          'trade-off between the two is worth a closer look.',
      );
    }

    const riskFlags = this.buildRiskFlags(
      includedResults.slice(0, TOP_RESULTS_TO_CHECK_FOR_RISK),
      workRequirement.expectedStartDate,
    );
    if (riskFlags.length > 0) {
      sentences.push(`Compliance risk: ${riskFlags.join('; ')}.`);
    }

    if (excludedResults.length > 0) {
      const reason = this.mostCommonReason(excludedResults);
      sentences.push(
        `${excludedResults.length} of ${totalVendorsEvaluated} evaluated vendors were excluded, most ` +
          `commonly because: ${reason?.toLowerCase()}.`,
      );
    }

    return sentences.join(' ');
  }

  private topFactor(breakdown: SummaryInputVendorResult['scoreBreakdown']): {
    label: string;
    value: number;
  } {
    const entries = Object.entries(
      breakdown as unknown as Record<string, number>,
    );
    const [key, value] = entries.sort((a, b) => b[1] - a[1])[0];
    return { label: SCORE_BREAKDOWN_LABELS[key] ?? key, value };
  }

  private buildRiskFlags(
    topResults: SummaryInputVendorResult[],
    expectedStartDate: string,
  ): string[] {
    const flags: string[] = [];
    const now = new Date();
    const riskWindowEnd = new Date(expectedStartDate);
    riskWindowEnd.setDate(riskWindowEnd.getDate() + EXPIRY_RISK_WINDOW_DAYS);

    for (const result of topResults) {
      for (const doc of result.documents) {
        const expiry = new Date(doc.expiryDate);
        const label = doc.documentType.toLowerCase().replace(/_/g, ' ');
        if (expiry < now) {
          flags.push(`${result.vendorName}'s ${label} has already expired`);
        } else if (expiry <= riskWindowEnd) {
          flags.push(
            `${result.vendorName}'s ${label} expires within 30 days of the expected start date`,
          );
        }
      }
    }
    return flags;
  }

  private mostCommonReason(
    excluded: SummaryInputExcludedVendor[],
  ): string | null {
    if (excluded.length === 0) {
      return null;
    }
    const counts = new Map<string, number>();
    for (const vendor of excluded) {
      counts.set(
        vendor.excludedReason,
        (counts.get(vendor.excludedReason) ?? 0) + 1,
      );
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }
}
