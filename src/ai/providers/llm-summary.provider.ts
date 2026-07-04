import { Injectable } from '@nestjs/common';
import { SummaryInput } from '../interfaces/summary-input.interface';
import {
  SummaryGenerationResult,
  SummaryProvider,
} from '../interfaces/summary-provider.interface';

// gemini-2.5-flash has a free tier under Google AI Studio API keys.
const MODEL = 'gemini-2.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const MAX_OUTPUT_TOKENS = 400;

const SYSTEM_PROMPT = `You are an assistant that summarizes vendor recommendation results for an operations manager at an infrastructure company. You do not make recommendations yourself — a deterministic scoring engine has already ranked the vendors. Your job is only to explain the results clearly and flag risks.

Rules:
1. Only use facts present in the input JSON. Never invent scores, ratings, document statuses, or vendor details not provided.
2. Do not change the ranking or suggest a different vendor should be first.
3. Explain WHY the top vendor(s) scored well, referencing their actual score breakdown factors.
4. Explicitly flag compliance risks: expired documents, or documents expiring within 30 days of the work requirement's expected start date.
5. If vendors were excluded, briefly mention how many and the most common reason.
6. Keep the summary to 4-6 sentences. Plain, professional tone. No bullet points, no markdown, no headers.
7. If two vendors are close in score (within 5 points), mention the trade-off between them.`;

function buildUserPrompt(input: SummaryInput): string {
  const {
    workRequirement,
    includedResults,
    excludedResults,
    totalVendorsEvaluated,
  } = input;
  return `Work Requirement:
- Title: ${workRequirement.title}
- Category: ${workRequirement.category}
- Location: ${workRequirement.location}
- Priority: ${workRequirement.priority}
- Estimated Value: ${workRequirement.estimatedValue}
- Expected Start Date: ${workRequirement.expectedStartDate}

Ranked Vendor Results:
${JSON.stringify(includedResults, null, 2)}

Excluded Vendors:
${JSON.stringify(excludedResults, null, 2)}

Total vendors evaluated: ${totalVendorsEvaluated}

Task: Write a short recommendation summary for the operations manager based only on the data above.`;
}

interface GeminiGenerateContentResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
}

@Injectable()
export class LlmSummaryProvider implements SummaryProvider {
  async generate(input: SummaryInput): Promise<SummaryGenerationResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const start = Date.now();
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: buildUserPrompt(input) }] }],
        generationConfig: {
          maxOutputTokens: MAX_OUTPUT_TOKENS,
          // gemini-2.5-flash "thinks" by default, which otherwise eats the entire
          // maxOutputTokens budget on hidden reasoning and truncates the visible answer.
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Gemini API request failed with status ${response.status}: ${body}`,
      );
    }

    const data = (await response.json()) as GeminiGenerateContentResponse;
    const generationTimeMs = Date.now() - start;
    const summaryText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!summaryText) {
      throw new Error('Gemini API returned an empty summary');
    }

    return {
      summaryText,
      model: MODEL,
      inputTokens: data.usageMetadata?.promptTokenCount ?? null,
      outputTokens: data.usageMetadata?.candidatesTokenCount ?? null,
      generationTimeMs,
    };
  }
}
