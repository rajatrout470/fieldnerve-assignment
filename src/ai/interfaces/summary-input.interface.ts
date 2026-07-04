import { ScoreBreakdown } from '../../recommendations/interfaces/score-breakdown.interface';

// This is the only contract the ai module depends on — it never imports
// Vendor/WorkRequirement types, so it stays swappable and testable in isolation.
export interface SummaryInputDocument {
  documentType: string;
  expiryDate: string;
}

export interface SummaryInputVendorResult {
  vendorId: number;
  vendorName: string;
  totalScore: number;
  rank: number;
  scoreBreakdown: ScoreBreakdown;
  documents: SummaryInputDocument[];
}

export interface SummaryInputExcludedVendor {
  vendorId: number;
  vendorName: string;
  excludedReason: string;
}

export interface SummaryInputWorkRequirement {
  title: string;
  category: string;
  location: string;
  priority: string;
  estimatedValue: string;
  expectedStartDate: string;
}

export interface SummaryInput {
  workRequirement: SummaryInputWorkRequirement;
  includedResults: SummaryInputVendorResult[];
  excludedResults: SummaryInputExcludedVendor[];
  totalVendorsEvaluated: number;
}
