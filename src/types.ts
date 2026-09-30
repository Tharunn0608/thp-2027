export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type NodeType = 
  | 'Repository'
  | 'Commit'
  | 'File'
  | 'Function'
  | 'Service'
  | 'API'
  | 'Database'
  | 'Table'
  | 'Queue'
  | 'ExternalService'
  | 'Infrastructure'
  | 'Test'
  | 'Incident'
  | 'Deployment'
  | 'RuntimeObservation';

export type EdgeType =
  | 'CONTAINS'
  | 'MODIFIES'
  | 'IMPORTS'
  | 'CALLS'
  | 'EXPOSES'
  | 'CALLS_API'
  | 'DEPENDS_ON'
  | 'READS'
  | 'WRITES'
  | 'PUBLISHES'
  | 'CONSUMES'
  | 'DEPLOYS_TO'
  | 'OBSERVED_CALL'
  | 'TESTS'
  | 'ASSOCIATED_WITH_INCIDENT'
  | 'AFFECTS';

export interface GraphNode {
  id: string;
  type: NodeType;
  name: string;
  criticality?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  metadata?: Record<string, any>;
  isChanged?: boolean;
  impactType?: 'DIRECT' | 'INDIRECT' | 'NONE';
  impactScore?: number;
  status?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  sourceType: 'static' | 'runtime' | 'historical' | 'inferred';
  weight?: number;
  confidence?: number;
  firstSeen?: string;
  lastSeen?: string;
  timestamp?: string;
  observationCount?: number;
  metadata?: Record<string, any>;
}

export interface SoftwareGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  timestamp: string; // T0 snapshot validity
  snapshotId: string;
}

export interface ChangedEntity {
  id: string;
  type: 'file' | 'function' | 'api' | 'config' | 'schema';
  name: string;
  path: string;
  changeKind: 'added' | 'modified' | 'deleted';
  linesAdded: number;
  linesDeleted: number;
  diffSummary: string;
}

export interface ChangeAnalysisRequest {
  repositoryId: string;
  commitSha: string;
  baseSha?: string;
  predictionTimeT0: string; // Mandatory temporal cutoff
  environment: string;
  modelFamily?: 'B1_STATIC' | 'B2_RULE' | 'B3_TRADITIONAL_ML' | 'B4_GRAPH_ML' | 'B5_TEMPORAL_GRAPH_ML';
  options?: {
    includeRuntime: boolean;
    includeHistory: boolean;
    includeTemporal: boolean;
    generateExplanation: boolean;
  };
}

export interface EvidenceItem {
  id: string;
  type: 'graph' | 'runtime' | 'history' | 'temporal' | 'change';
  sourceReference: string;
  timestamp: string;
  summary: string;
  weight: number;
  relatedEntityIds: string[];
}

export interface AffectedComponent {
  id: string;
  nodeId: string;
  name: string;
  type: NodeType;
  impactType: 'DIRECT' | 'INDIRECT';
  impactScore: number;
  criticality: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  pathFromChange: string[];
  evidenceIds: string[];
  reason: string;
}

export interface RecommendedTest {
  id: string;
  name: string;
  suite: string;
  type: 'unit' | 'integration' | 'e2e';
  priority: 'P0' | 'P1' | 'P2';
  score: number;
  mappedComponentIds: string[];
  reason: string;
  estimatedDurationMs: number;
  historicalFailureCorrelation?: number;
}

export interface WhatIfScenario {
  id: string;
  type: 'NORMAL' | 'CANARY_10' | 'FEATURE_FLAG' | 'ADDITIONAL_TESTS' | 'STAGED_ROLLOUT';
  name: string;
  description: string;
  estimatedRiskScore: number;
  estimatedExposure: 'LOW' | 'CONTROLLED' | 'HIGH';
  residualRisk: 'MINIMAL' | 'LOW' | 'MODERATE' | 'HIGH';
  assumptions: string[];
  recommendedActions: string[];
}

export interface AnalysisResult {
  analysisId: string;
  repositoryId: string;
  commitSha: string;
  baseSha?: string;
  predictionTimeT0: string;
  status: 'COMPLETED' | 'PARTIAL' | 'FAILED';
  changeSummary: {
    message: string;
    author: string;
    changeType: 'API' | 'DATABASE' | 'BUSINESS_LOGIC' | 'CONFIGURATION' | 'INFRASTRUCTURE' | 'UI' | 'SECURITY';
    filesChanged: number;
    insertions: number;
    deletions: number;
    entities: ChangedEntity[];
  };
  graph: SoftwareGraph;
  risk: {
    score: number; // 0 - 100
    level: RiskLevel;
    confidence: number; // 0.0 - 1.0
    modelId: string;
    modelVersion: string;
    calibratedProbability: number;
  };
  blastRadius: {
    score: number;
    directCount: number;
    indirectCount: number;
    criticalCount: number;
    externalDependencyCount: number;
    maxDepth: number;
    runtimeTrafficExposureReqPerSec: number;
    summary: string;
  };
  affectedComponents: AffectedComponent[];
  evidence: EvidenceItem[];
  recommendedTests: RecommendedTest[];
  testMetrics: {
    totalSuiteCount: number;
    selectedCount: number;
    testReductionPercent: number;
    estimatedTimeSavedSeconds: number;
    projectedFailureDetectionRetained: number; // e.g. 98%
  };
  whatIfScenarios: WhatIfScenario[];
  explanation: {
    summary: string;
    whyRisky: string;
    traceableEvidenceIds: string[];
    suggestedMitigation: string;
    uncertaintyNotice?: string;
    generatedBy: 'GEMINI_AI' | 'DETERMINISTIC_GROUNDED_ENGINE';
  };
  releaseDecision?: {
    status: 'RELEASE' | 'RELEASE_WITH_MITIGATION' | 'TEST_MORE' | 'DELAY';
    decidedBy?: string;
    timestamp?: string;
    rationale?: string;
  };
  actualOutcome?: {
    recordedAt: string;
    deploymentStatus: 'SUCCESS' | 'FAILED' | 'ROLLED_BACK';
    incidentOccurred: boolean;
    incidentId?: string;
    failedTestIds: string[];
    observedAffectedComponents: string[];
    latencyDeltaPercent: number;
    errorRateDeltaPercent: number;
  };
}

export interface ExperimentRun {
  id: string;
  experimentCode: string;
  name: string;
  modelBaseline: 'B0_RANDOM' | 'B1_STATIC' | 'B2_RULE' | 'B3_TRADITIONAL_ML' | 'B4_GRAPH_ML' | 'B5_TEMPORAL_GRAPH_ML';
  datasetVersion: string;
  splitVersion: string;
  metrics: {
    precision: number;
    recall: number;
    f1: number;
    auroc: number;
    prAuc: number;
    affectedRecall: number;
    testReductionPercent: number;
    failureDetectionRetained: number;
    inferenceLatencyMs: number;
  };
  ablations?: {
    configName: string;
    f1: number;
    recall: number;
    auroc: number;
    affectedRecall: number;
  }[];
}
