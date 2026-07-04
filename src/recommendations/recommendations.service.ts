import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { RecommendationsRepository } from './recommendations.repository';
import { Recommendation } from './entities/recommendation.entity';
import { ScoreBreakdown } from './interfaces/score-breakdown.interface';
import { MANDATORY_DOCUMENT_TYPES } from './constants/mandatory-document-types.constant';
import { VendorsService } from '../vendors/services/vendors.service';
import { Vendor } from '../vendors/entities/vendor.entity';
import { VendorStatus } from '../vendors/enums/vendor-status.enum';
import { VendorDocumentsService } from '../vendor-documents/services/vendor-documents.service';
import { VendorDocument } from '../vendor-documents/entities/vendor-document.entity';
import { DocumentType } from '../vendor-documents/enums/document-type.enum';
import { WorkRequirementsService } from '../work-requirements/services/work-requirements.service';
import { WorkRequirement } from '../work-requirements/entities/work-requirement.entity';
import { Priority } from '../work-requirements/enums/priority.enum';
import { AiService } from '../ai/ai.service';
import {
  SummaryInput,
  SummaryInputExcludedVendor,
  SummaryInputVendorResult,
} from '../ai/interfaces/summary-input.interface';

const HIGH_PRIORITY_RATING_THRESHOLD = 4;

interface EvaluatedResult {
  vendorId: number;
  excluded: boolean;
  excludedReason: string | null;
  totalScore: number | null;
  rank: number | null;
  scoreBreakdown: ScoreBreakdown | null;
}

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(
    private readonly recommendationsRepository: RecommendationsRepository,
    private readonly vendorsService: VendorsService,
    private readonly vendorDocumentsService: VendorDocumentsService,
    private readonly workRequirementsService: WorkRequirementsService,
    private readonly aiService: AiService,
  ) {}

  async generateRecommendation(
    workRequirementId: number,
  ): Promise<Recommendation> {
    const workRequirement =
      await this.workRequirementsService.findOne(workRequirementId);
    const vendors = await this.vendorsService.findAll();
    const referenceDate = new Date();

    const vendorById = new Map<number, Vendor>(
      vendors.map((vendor) => [vendor.id, vendor]),
    );
    const documentsByVendorId = new Map<number, VendorDocument[]>();
    const results: EvaluatedResult[] = [];

    for (const vendor of vendors) {
      const excludedResult = await this.evaluateHardFilters(
        vendor,
        workRequirement,
        referenceDate,
        documentsByVendorId,
      );
      if (excludedResult) {
        results.push(excludedResult);
        continue;
      }

      const documents = documentsByVendorId.get(vendor.id) ?? [];
      const scoreBreakdown = this.scoreVendor(
        vendor,
        workRequirement,
        documents,
        referenceDate,
      );
      const totalScore = this.round(
        scoreBreakdown.categoryMatch +
          scoreBreakdown.locationMatch +
          scoreBreakdown.rating +
          scoreBreakdown.compliance +
          scoreBreakdown.priorityFit,
      );

      results.push({
        vendorId: vendor.id,
        excluded: false,
        excludedReason: null,
        totalScore,
        rank: null,
        scoreBreakdown,
      });
    }

    const included = results
      .filter((result) => !result.excluded)
      .sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0));
    included.forEach((result, index) => {
      result.rank = index + 1;
    });

    const recommendation =
      await this.recommendationsRepository.createRecommendation({
        workRequirementId,
        totalVendorsEvaluated: vendors.length,
        results: results.map((result) => ({ ...result })),
      });

    try {
      const summaryInput = this.buildSummaryInput(
        workRequirement,
        results,
        vendorById,
        documentsByVendorId,
      );
      recommendation.aiSummary = await this.aiService.generateAndPersistSummary(
        recommendation.id,
        summaryInput,
      );
    } catch (error) {
      this.logger.error(
        `AI summary generation failed unexpectedly, returning recommendation without a summary: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      recommendation.aiSummary = null;
    }

    return recommendation;
  }

  async getLatestRecommendation(
    workRequirementId: number,
  ): Promise<Recommendation> {
    await this.workRequirementsService.findOne(workRequirementId);
    const recommendation =
      await this.recommendationsRepository.findLatestByWorkRequirement(
        workRequirementId,
      );
    if (!recommendation) {
      throw new NotFoundException(
        `No recommendation found for work requirement ${workRequirementId}`,
      );
    }
    return recommendation;
  }

  private async evaluateHardFilters(
    vendor: Vendor,
    workRequirement: WorkRequirement,
    referenceDate: Date,
    documentsByVendorId: Map<number, VendorDocument[]>,
  ): Promise<EvaluatedResult | null> {
    if (vendor.status !== VendorStatus.ACTIVE) {
      return this.excluded(vendor.id, 'Vendor is not active');
    }

    if (vendor.category !== workRequirement.category) {
      return this.excluded(
        vendor.id,
        'Category does not match work requirement',
      );
    }

    const documents = await this.vendorDocumentsService.findByVendor(vendor.id);
    documentsByVendorId.set(vendor.id, documents);

    const missingType = MANDATORY_DOCUMENT_TYPES.find((type) => {
      const doc = this.latestDocumentOfType(documents, type);
      return !doc || !this.isDocumentValid(doc, referenceDate);
    });
    if (missingType) {
      return this.excluded(
        vendor.id,
        `Missing or invalid mandatory document: ${missingType}`,
      );
    }

    return null;
  }

  private excluded(vendorId: number, reason: string): EvaluatedResult {
    return {
      vendorId,
      excluded: true,
      excludedReason: reason,
      totalScore: null,
      rank: null,
      scoreBreakdown: null,
    };
  }

  private scoreVendor(
    vendor: Vendor,
    workRequirement: WorkRequirement,
    documents: VendorDocument[],
    referenceDate: Date,
  ): ScoreBreakdown {
    const rating = Number(vendor.rating);
    return {
      categoryMatch: 25,
      locationMatch: this.scoreLocation(
        vendor.operatingLocation,
        workRequirement.location,
      ),
      rating: this.round((rating / 5) * 25),
      compliance: this.scoreCompliance(documents, referenceDate),
      priorityFit: this.scorePriorityFit(workRequirement.priority, rating),
    };
  }

  private scoreLocation(
    vendorLocation: string,
    requirementLocation: string,
  ): number {
    if (
      vendorLocation.trim().toLowerCase() ===
      requirementLocation.trim().toLowerCase()
    ) {
      return 20;
    }
    if (this.region(vendorLocation) === this.region(requirementLocation)) {
      return 10;
    }
    return 0;
  }

  private region(location: string): string {
    const lastCommaIndex = location.lastIndexOf(',');
    const region =
      lastCommaIndex === -1 ? location : location.slice(lastCommaIndex + 1);
    return region.trim().toLowerCase();
  }

  private scoreCompliance(
    documents: VendorDocument[],
    referenceDate: Date,
  ): number {
    const validCount = MANDATORY_DOCUMENT_TYPES.filter((type) => {
      const doc = this.latestDocumentOfType(documents, type);
      return doc !== undefined && this.isDocumentValid(doc, referenceDate);
    }).length;
    return this.round((validCount / MANDATORY_DOCUMENT_TYPES.length) * 20);
  }

  private scorePriorityFit(priority: Priority, rating: number): number {
    if (priority === Priority.HIGH || priority === Priority.URGENT) {
      return rating >= HIGH_PRIORITY_RATING_THRESHOLD ? 10 : 4;
    }
    return 7;
  }

  // The vendor-documents module has no "valid/expired" status field, only
  // issueDate/expiryDate, so validity is derived from the expiry date instead.
  private isDocumentValid(
    document: VendorDocument,
    referenceDate: Date,
  ): boolean {
    return new Date(document.expiryDate) >= referenceDate;
  }

  private latestDocumentOfType(
    documents: VendorDocument[],
    type: DocumentType,
  ): VendorDocument | undefined {
    return documents
      .filter((document) => document.documentType === type)
      .sort(
        (a, b) =>
          new Date(b.expiryDate).getTime() - new Date(a.expiryDate).getTime(),
      )[0];
  }

  private round(value: number): number {
    return Number(value.toFixed(2));
  }

  private buildSummaryInput(
    workRequirement: WorkRequirement,
    results: EvaluatedResult[],
    vendorById: Map<number, Vendor>,
    documentsByVendorId: Map<number, VendorDocument[]>,
  ): SummaryInput {
    const includedResults: SummaryInputVendorResult[] = results
      .filter((result) => !result.excluded)
      .sort((a, b) => (a.rank as number) - (b.rank as number))
      .map((result) => ({
        vendorId: result.vendorId,
        vendorName:
          vendorById.get(result.vendorId)?.name ?? `Vendor ${result.vendorId}`,
        totalScore: result.totalScore as number,
        rank: result.rank as number,
        scoreBreakdown: result.scoreBreakdown as ScoreBreakdown,
        documents: (documentsByVendorId.get(result.vendorId) ?? []).map(
          (document) => ({
            documentType: document.documentType,
            expiryDate: document.expiryDate,
          }),
        ),
      }));

    const excludedResults: SummaryInputExcludedVendor[] = results
      .filter((result) => result.excluded)
      .map((result) => ({
        vendorId: result.vendorId,
        vendorName:
          vendorById.get(result.vendorId)?.name ?? `Vendor ${result.vendorId}`,
        excludedReason: result.excludedReason as string,
      }));

    return {
      workRequirement: {
        title: workRequirement.title,
        category: workRequirement.category,
        location: workRequirement.location,
        priority: workRequirement.priority,
        estimatedValue: workRequirement.estimatedValue,
        expectedStartDate: workRequirement.expectedStartDate,
      },
      includedResults,
      excludedResults,
      totalVendorsEvaluated: vendorById.size,
    };
  }
}
