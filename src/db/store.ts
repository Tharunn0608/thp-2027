import { AnalysisResult, SoftwareGraph } from '../types.ts';
import { PRECONFIGURED_ANALYSES, CONTROLLED_MICROSERVICE_GRAPH } from '../mockData.ts';

class DatabaseStore {
  private analyses: Map<string, AnalysisResult> = new Map();
  private graphSnapshots: Map<string, SoftwareGraph> = new Map();
  private outcomes: Map<string, any[]> = new Map();
  private auditDecisions: Array<{
    id: string;
    timestamp: string;
    analysisId: string;
    decision: string;
    rationale: string;
    actor: string;
  }> = [];

  constructor() {
    this.seed();
  }

  private seed() {
    // Seed default analyses
    Object.values(PRECONFIGURED_ANALYSES).forEach((analysis: AnalysisResult) => {
      this.analyses.set(analysis.analysisId, analysis);
    });

    // Seed base graph
    this.graphSnapshots.set('snap-ecommerce-v1.4', CONTROLLED_MICROSERVICE_GRAPH);

    // Seed historical decision logs
    this.auditDecisions.push({
      id: 'dec-1',
      timestamp: '2026-09-17T09:05:00Z',
      analysisId: 'an-452',
      decision: 'RELEASE_WITH_MITIGATION (Canary 10%)',
      rationale: 'P0 verification tests scheduled; blast radius contained through canary deployment.',
      actor: 'release.engineer@org.internal'
    });
  }

  // Analyses Queries & Mutations
  public getAnalysis(id: string): AnalysisResult | undefined {
    return this.analyses.get(id);
  }

  public getAllAnalyses(): AnalysisResult[] {
    return Array.from(this.analyses.values());
  }

  public saveAnalysis(analysis: AnalysisResult): void {
    this.analyses.set(analysis.analysisId, analysis);
  }

  // Decisions / Human Audit Records
  public recordDecision(analysisId: string, decision: string, rationale: string, actor: string = 'engineer@org.internal') {
    const record = {
      id: `dec-${Date.now()}`,
      timestamp: new Date().toISOString(),
      analysisId,
      decision,
      rationale,
      actor
    };
    this.auditDecisions.push(record);
    return record;
  }

  public getDecisions() {
    return [...this.auditDecisions];
  }

  // Post-T0 Outcome Feedback Loop
  public recordOutcome(analysisId: string, outcome: any) {
    const existing = this.outcomes.get(analysisId) || [];
    const entry = {
      ...outcome,
      recordedAt: new Date().toISOString()
    };
    existing.push(entry);
    this.outcomes.set(analysisId, existing);
    return entry;
  }

  public getOutcomes(analysisId: string) {
    return this.outcomes.get(analysisId) || [];
  }
}

export const db = new DatabaseStore();
