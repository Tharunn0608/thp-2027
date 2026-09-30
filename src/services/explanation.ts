import { GoogleGenAI } from '@google/genai';
import { AnalysisResult } from '../types.ts';

export class ExplanationService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        this.ai = new GoogleGenAI({ apiKey });
      } catch (err) {
        console.warn('Gemini client initialization deferred:', err);
      }
    }
  }

  /**
   * Generates a grounded natural-language explanation.
   * STRICT GUARDRAIL: Only facts present in the structured analysis result are passed.
   * The LLM is forbidden from inventing graph edges or unverified incidents.
   */
  public async generateExplanation(analysis: AnalysisResult): Promise<{
    summary: string;
    whyRisky: string;
    suggestedMitigation: string;
    traceableEvidenceIds: string[];
    generatedBy: 'GEMINI_AI' | 'DETERMINISTIC_GROUNDED_ENGINE';
  }> {
    if (!this.ai || !process.env.GEMINI_API_KEY) {
      // Deterministic zero-downtime fallback
      return {
        summary: `${analysis.risk.level} Risk (Score ${analysis.risk.score}/100). The proposed change impacts ${analysis.affectedComponents.length} downstream components.`,
        whyRisky: `The change directly touches ${analysis.changeSummary.entities[0]?.name || 'core code'} which propagates through ${analysis.blastRadius.directCount} direct and ${analysis.blastRadius.indirectCount} indirect dependencies with active runtime load.`,
        suggestedMitigation: `Prioritize ${analysis.recommendedTests.filter(t => t.priority === 'P0').length} P0 verification tests. Consider a staged 10% canary deployment.`,
        traceableEvidenceIds: analysis.evidence.map(e => e.id),
        generatedBy: 'DETERMINISTIC_GROUNDED_ENGINE'
      };
    }

    try {
      const sanitizedContext = {
        commit: analysis.commitSha,
        riskScore: analysis.risk.score,
        riskLevel: analysis.risk.level,
        changedEntities: analysis.changeSummary.entities.map(e => e.name),
        affectedComponents: analysis.affectedComponents.map(c => ({ name: c.name, type: c.type, criticality: c.criticality })),
        evidence: analysis.evidence.map(e => ({ id: e.id, summary: e.summary, type: e.type })),
        recommendedP0Tests: analysis.recommendedTests.filter(t => t.priority === 'P0').map(t => t.name)
      };

      const prompt = `
You are a release engineering AI assistant. Explain the following software change risk prediction.
CRITICAL INSTRUCTION:
- Base your explanation ONLY on the provided structured facts.
- Do NOT invent edges, incidents, or test results.
- Cite the evidence IDs (e.g. [ev-code-1]) directly where applicable.

Context:
${JSON.stringify(sanitizedContext, null, 2)}

Provide your answer in strict JSON format:
{
  "summary": "one-sentence overview",
  "whyRisky": "paragraph explaining causal propagation and historical/runtime evidence",
  "suggestedMitigation": "actionable release engineering guidance"
}
`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      const text = response.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary,
          whyRisky: parsed.whyRisky,
          suggestedMitigation: parsed.suggestedMitigation,
          traceableEvidenceIds: analysis.evidence.map(e => e.id),
          generatedBy: 'GEMINI_AI'
        };
      }
    } catch (err) {
      console.error('Failed to generate LLM explanation, falling back to deterministic template:', err);
    }

    return {
      summary: `${analysis.risk.level} Risk (Score ${analysis.risk.score}/100). The proposed change impacts ${analysis.affectedComponents.length} downstream components.`,
      whyRisky: `The change directly touches ${analysis.changeSummary.entities[0]?.name || 'core code'} which propagates through ${analysis.blastRadius.directCount} direct dependencies with active runtime load.`,
      suggestedMitigation: `Prioritize ${analysis.recommendedTests.filter(t => t.priority === 'P0').length} P0 verification tests before production promotion.`,
      traceableEvidenceIds: analysis.evidence.map(e => e.id),
      generatedBy: 'DETERMINISTIC_GROUNDED_ENGINE'
    };
  }
}
