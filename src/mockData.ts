import { SoftwareGraph, AnalysisResult, ExperimentRun } from './types.ts';
import { 
  COLLEGE_MANAGEMENT_ANALYSIS, 
  BANKING_ANALYSIS, 
  SAAS_ANALYSIS 
} from './data/repositories.ts';

export const CONTROLLED_MICROSERVICE_GRAPH: SoftwareGraph = {
  timestamp: '2026-09-17T09:00:00Z',
  snapshotId: 'snap-ecommerce-v1.4',
  nodes: [
    { id: 'srv-gateway', type: 'Service', name: 'API Gateway', criticality: 'CRITICAL', status: 'healthy' },
    { id: 'api-checkout', type: 'API', name: 'POST /v1/checkout', criticality: 'CRITICAL', metadata: { method: 'POST', path: '/v1/checkout' } },
    { id: 'srv-order', type: 'Service', name: 'Order Service', criticality: 'HIGH', status: 'healthy' },
    { id: 'fn-order-calc', type: 'Function', name: 'OrderService.processOrder()', criticality: 'HIGH' },
    { id: 'db-order', type: 'Database', name: 'Order PostgreSQL DB', criticality: 'HIGH', metadata: { tables: ['orders', 'line_items'] } },
    { id: 'srv-payment', type: 'Service', name: 'Payment Service', criticality: 'CRITICAL', status: 'degraded' },
    { id: 'fn-calc-total', type: 'Function', name: 'PaymentService.calculateTotal()', criticality: 'CRITICAL', isChanged: true },
    { id: 'db-payment', type: 'Database', name: 'Payments DB', criticality: 'CRITICAL', metadata: { tables: ['transactions', 'ledgers'] } },
    { id: 'ext-stripe', type: 'ExternalService', name: 'Stripe Gateway API', criticality: 'CRITICAL', metadata: { provider: 'Stripe' } },
    { id: 'queue-events', type: 'Queue', name: 'Kafka orders.events Topic', criticality: 'MEDIUM', metadata: { partitions: 12 } },
    { id: 'srv-notification', type: 'Service', name: 'Notification Service', criticality: 'LOW', status: 'healthy' },
    { id: 'srv-inventory', type: 'Service', name: 'Inventory Service', criticality: 'HIGH', status: 'healthy' },
    { id: 'db-inventory', type: 'Database', name: 'Inventory DB', criticality: 'HIGH' },
  ],
  edges: [
    { id: 'e1', source: 'srv-gateway', target: 'api-checkout', type: 'EXPOSES', sourceType: 'static' },
    { id: 'e2', source: 'api-checkout', target: 'srv-order', type: 'CALLS_API', sourceType: 'static', weight: 1.0 },
    { id: 'e3', source: 'srv-order', target: 'fn-order-calc', type: 'CONTAINS', sourceType: 'static' },
    { id: 'e4', source: 'fn-order-calc', target: 'srv-payment', type: 'CALLS', sourceType: 'static', weight: 0.95 },
    { id: 'e5', source: 'srv-payment', target: 'fn-calc-total', type: 'CONTAINS', sourceType: 'static' },
    { id: 'e6', source: 'fn-calc-total', target: 'db-payment', type: 'WRITES', sourceType: 'static', weight: 0.9 },
    { id: 'e7', source: 'srv-payment', target: 'ext-stripe', type: 'CALLS_API', sourceType: 'static', weight: 0.85 },
    { id: 'e8', source: 'srv-order', target: 'db-order', type: 'WRITES', sourceType: 'static' },
    { id: 'e9', source: 'srv-order', target: 'queue-events', type: 'PUBLISHES', sourceType: 'static' },
    { id: 'e10', source: 'queue-events', target: 'srv-notification', type: 'CONSUMES', sourceType: 'static' },
    { id: 'e11', source: 'srv-order', target: 'srv-inventory', type: 'CALLS', sourceType: 'static' },
    { id: 'e12', source: 'srv-inventory', target: 'db-inventory', type: 'WRITES', sourceType: 'static' },
    // Runtime telemetry observed edges (verified prior to T0)
    { 
      id: 'e-rt-1', source: 'srv-gateway', target: 'srv-order', type: 'OBSERVED_CALL', sourceType: 'runtime', 
      observationCount: 14200, weight: 0.98, metadata: { rps: 1840, p95_latency_ms: 18 } 
    },
    { 
      id: 'e-rt-2', source: 'srv-order', target: 'srv-payment', type: 'OBSERVED_CALL', sourceType: 'runtime', 
      observationCount: 9800, weight: 0.95, metadata: { rps: 920, p95_latency_ms: 84, error_rate: 0.024 } 
    },
    { 
      id: 'e-rt-3', source: 'srv-payment', target: 'db-payment', type: 'OBSERVED_CALL', sourceType: 'runtime', 
      observationCount: 11200, weight: 0.90, metadata: { rps: 1100, lock_wait_ms: 14 } 
    }
  ]
};

export const PRECONFIGURED_ANALYSES: Record<string, AnalysisResult> = {
  'commit-452-high-risk': {
    analysisId: 'an-452',
    repositoryId: 'repo-ecommerce-core',
    commitSha: 'c452f89a91',
    baseSha: 'b451e029c7',
    predictionTimeT0: '2026-09-17T09:00:00Z',
    status: 'COMPLETED',
    changeSummary: {
      message: 'refactor(payment): modify calculateTotal() discount and tax rounding rules',
      author: 'dev.lead@release-eng.org',
      changeType: 'BUSINESS_LOGIC',
      filesChanged: 2,
      insertions: 48,
      deletions: 19,
      entities: [
        {
          id: 'ent-1',
          type: 'function',
          name: 'PaymentService.calculateTotal()',
          path: 'src/services/PaymentService.ts',
          changeKind: 'modified',
          linesAdded: 34,
          linesDeleted: 12,
          diffSummary: 'Changed currency decimal conversion and VAT calculation order.'
        },
        {
          id: 'ent-2',
          type: 'schema',
          name: 'payments.transactions (amount precision)',
          path: 'db/migrations/20260917_payment_precision.sql',
          changeKind: 'modified',
          linesAdded: 14,
          linesDeleted: 7,
          diffSummary: 'Decimal(10,2) cast adjustments.'
        }
      ]
    },
    graph: CONTROLLED_MICROSERVICE_GRAPH,
    risk: {
      score: 87,
      level: 'HIGH',
      confidence: 0.89,
      modelId: 'temporal-gnn-release-v2.1',
      modelVersion: 'v2.1.0',
      calibratedProbability: 0.84
    },
    blastRadius: {
      score: 82,
      directCount: 2,
      indirectCount: 4,
      criticalCount: 3,
      externalDependencyCount: 1,
      maxDepth: 3,
      runtimeTrafficExposureReqPerSec: 920,
      summary: 'High blast radius propagating through Order Service, Payment DB, Kafka Queue and Stripe Gateway API.'
    },
    affectedComponents: [
      {
        id: 'aff-1',
        nodeId: 'srv-payment',
        name: 'Payment Service',
        type: 'Service',
        impactType: 'DIRECT',
        impactScore: 0.96,
        criticality: 'CRITICAL',
        pathFromChange: ['PaymentService.calculateTotal()', 'Payment Service'],
        evidenceIds: ['ev-code-1', 'ev-rt-traffic'],
        reason: 'Direct modification of financial calculation core with 920 req/s active throughput.'
      },
      {
        id: 'aff-2',
        nodeId: 'db-payment',
        name: 'Payments DB (Ledger)',
        type: 'Database',
        impactType: 'DIRECT',
        impactScore: 0.88,
        criticality: 'CRITICAL',
        pathFromChange: ['PaymentService.calculateTotal()', 'Payments DB'],
        evidenceIds: ['ev-schema-mod', 'ev-hist-inc108'],
        reason: 'Transactional persistence path with modified precision semantics.'
      },
      {
        id: 'aff-3',
        nodeId: 'srv-order',
        name: 'Order Service',
        type: 'Service',
        impactType: 'INDIRECT',
        impactScore: 0.81,
        criticality: 'HIGH',
        pathFromChange: ['PaymentService.calculateTotal()', 'Payment Service', 'Order Service'],
        evidenceIds: ['ev-call-path', 'ev-rt-latency'],
        reason: 'Upstream caller in checkout flow with synchronous blocking dependency.'
      },
      {
        id: 'aff-4',
        nodeId: 'api-checkout',
        name: 'POST /v1/checkout',
        type: 'API',
        impactType: 'INDIRECT',
        impactScore: 0.76,
        criticality: 'CRITICAL',
        pathFromChange: ['PaymentService.calculateTotal()', 'Order Service', 'POST /v1/checkout'],
        evidenceIds: ['ev-api-contract'],
        reason: 'Customer-facing checkout gateway endpoint subject to timeout propagation.'
      },
      {
        id: 'aff-5',
        nodeId: 'queue-events',
        name: 'orders.events Kafka Topic',
        type: 'Queue',
        impactType: 'INDIRECT',
        impactScore: 0.52,
        criticality: 'MEDIUM',
        pathFromChange: ['PaymentService.calculateTotal()', 'Order Service', 'orders.events Topic'],
        evidenceIds: ['ev-async-queue'],
        reason: 'Downstream event payloads will reflect altered total payment attributes.'
      }
    ],
    evidence: [
      {
        id: 'ev-code-1',
        type: 'change',
        sourceReference: 'git:diff/c452f89a91',
        timestamp: '2026-09-17T08:55:00Z',
        summary: 'Modified core calculateTotal() function with 48 insertions and 19 deletions.',
        weight: 0.32,
        relatedEntityIds: ['fn-calc-total', 'srv-payment']
      },
      {
        id: 'ev-rt-traffic',
        type: 'runtime',
        sourceReference: 'otel:spans/traffic_window_t0',
        timestamp: '2026-09-17T08:58:00Z',
        summary: 'Observed 920 req/s live throughput between Order Service and Payment Service prior to T0.',
        weight: 0.28,
        relatedEntityIds: ['srv-payment', 'srv-order']
      },
      {
        id: 'ev-hist-inc108',
        type: 'history',
        sourceReference: 'incident:INC-108',
        timestamp: '2026-08-12T14:22:00Z',
        summary: 'Historical incident INC-108 involved precision truncation in calculateTotal() causing rollback.',
        weight: 0.24,
        relatedEntityIds: ['srv-payment', 'db-payment']
      },
      {
        id: 'ev-rt-latency',
        type: 'temporal',
        sourceReference: 'metric:temporal_window_14d',
        timestamp: '2026-09-17T08:45:00Z',
        summary: 'Latency trend in Payment Service increased 18% over the preceding 7 days (p95 from 71ms to 84ms).',
        weight: 0.16,
        relatedEntityIds: ['srv-payment']
      }
    ],
    recommendedTests: [
      {
        id: 't-pay-int-01',
        name: 'PaymentServiceIntegrationTest.testCurrencyPrecision()',
        suite: 'integration/payment',
        type: 'integration',
        priority: 'P0',
        score: 0.98,
        mappedComponentIds: ['srv-payment', 'db-payment'],
        reason: 'Directly validates rounding and decimal calculation on modified path.',
        estimatedDurationMs: 4200,
        historicalFailureCorrelation: 0.88
      },
      {
        id: 't-order-calc-02',
        name: 'OrderFlowTest.testOrderTotalSyncWithPayment()',
        suite: 'integration/order',
        type: 'integration',
        priority: 'P0',
        score: 0.94,
        mappedComponentIds: ['srv-order', 'srv-payment'],
        reason: 'Verifies total order calculation matches returned payment invoice.',
        estimatedDurationMs: 6500,
        historicalFailureCorrelation: 0.79
      },
      {
        id: 't-e2e-checkout-03',
        name: 'CheckoutE2ETest.testCompleteCheckoutJourney()',
        suite: 'e2e/checkout',
        type: 'e2e',
        priority: 'P1',
        score: 0.88,
        mappedComponentIds: ['api-checkout', 'srv-order', 'srv-payment', 'ext-stripe'],
        reason: 'End-to-end customer journey from API Gateway to Stripe Gateway API.',
        estimatedDurationMs: 14000,
        historicalFailureCorrelation: 0.65
      },
      {
        id: 't-db-ledger-04',
        name: 'PaymentLedgerConsistencyTest.testLedgerAuditTrail()',
        suite: 'integration/database',
        type: 'integration',
        priority: 'P1',
        score: 0.82,
        mappedComponentIds: ['db-payment'],
        reason: 'Ensures transaction balances match accounting ledger invariants.',
        estimatedDurationMs: 5100,
        historicalFailureCorrelation: 0.72
      },
      {
        id: 't-event-pub-05',
        name: 'KafkaOrderEventsTest.testOrderCreatedEventSchema()',
        suite: 'unit/events',
        type: 'unit',
        priority: 'P2',
        score: 0.45,
        mappedComponentIds: ['queue-events', 'srv-notification'],
        reason: 'Ensures schema validation on downstream event queue.',
        estimatedDurationMs: 1800,
        historicalFailureCorrelation: 0.21
      }
    ],
    testMetrics: {
      totalSuiteCount: 384,
      selectedCount: 5,
      testReductionPercent: 98.7,
      estimatedTimeSavedSeconds: 412,
      projectedFailureDetectionRetained: 97.4
    },
    whatIfScenarios: [
      {
        id: 'sc-baseline',
        type: 'NORMAL',
        name: 'Standard Direct Rollout',
        description: 'Direct 100% traffic switch to updated Payment Service container.',
        estimatedRiskScore: 87,
        estimatedExposure: 'HIGH',
        residualRisk: 'HIGH',
        assumptions: ['All 920 req/s live customer traffic will immediately hit new calculateTotal() logic.'],
        recommendedActions: ['Not recommended without preceding canary verification and P0 test passage.']
      },
      {
        id: 'sc-canary',
        type: 'CANARY_10',
        name: 'Canary Rollout (10% Traffic)',
        description: 'Route 10% of checkout traffic to candidate container with automated rollback threshold.',
        estimatedRiskScore: 38,
        estimatedExposure: 'CONTROLLED',
        residualRisk: 'LOW',
        assumptions: ['Failure blast radius isolated to max 92 req/s with 30-second automated rollback on 5xx spike.'],
        recommendedActions: ['Execute P0 tests, deploy 10% canary for 20 minutes, monitor error rate & latency metrics.']
      },
      {
        id: 'sc-flag',
        type: 'FEATURE_FLAG',
        name: 'Dark Launch / Feature Flag Guard',
        description: 'Wrap modified calculation behind ENABLE_NEW_TAX_ROUNDING feature flag.',
        estimatedRiskScore: 24,
        estimatedExposure: 'LOW',
        residualRisk: 'MINIMAL',
        assumptions: ['Calculation logic can be toggled in real time without service restarts or container redeploy.'],
        recommendedActions: ['Enable for internal synthetic test accounts first; verify ledger consistency before public switch.']
      }
    ],
    explanation: {
      summary: 'High Risk (Score 87/100). The proposed change alters financial calculation logic in PaymentService.calculateTotal() on a critical transaction path.',
      whyRisky: 'The modified entity sits on a critical path handling 920 req/s. It has direct data dependencies on Payments DB and synchronous coupling to Order Service. Historical incident INC-108 was triggered by a similar rounding adjustment resulting in ledger reconciliation rollbacks.',
      traceableEvidenceIds: ['ev-code-1', 'ev-rt-traffic', 'ev-hist-inc108', 'ev-rt-latency'],
      suggestedMitigation: 'Run P0 integration tests (PaymentServiceIntegrationTest & OrderFlowTest). Do not perform a 100% direct release; initiate a 10% Canary deployment with automated rollback if payment error rate exceeds 0.5%.',
      generatedBy: 'DETERMINISTIC_GROUNDED_ENGINE'
    },
    releaseDecision: {
      status: 'RELEASE_WITH_MITIGATION',
      decidedBy: 'lead.release-officer@company.internal',
      timestamp: '2026-09-17T09:15:00Z',
      rationale: 'Approved for 10% Canary deployment contingent on green P0 test execution.'
    },
    actualOutcome: {
      recordedAt: '2026-09-17T09:28:00Z',
      deploymentStatus: 'SUCCESS',
      incidentOccurred: false,
      failedTestIds: [],
      observedAffectedComponents: ['Payment Service', 'Payments DB'],
      latencyDeltaPercent: 1.2,
      errorRateDeltaPercent: -0.1
    }
  },
  'commit-301-low-risk': {
    analysisId: 'an-301',
    repositoryId: 'repo-ecommerce-core',
    commitSha: 'a301d4187e',
    baseSha: 'f300c9213b',
    predictionTimeT0: '2026-09-17T08:30:00Z',
    status: 'COMPLETED',
    changeSummary: {
      message: 'docs(readme): update notification queue delivery documentation',
      author: 'docs.maintainer@release-eng.org',
      changeType: 'UI',
      filesChanged: 1,
      insertions: 8,
      deletions: 2,
      entities: [
        {
          id: 'ent-doc-1',
          type: 'file',
          name: 'docs/notification-architecture.md',
          path: 'docs/notification-architecture.md',
          changeKind: 'modified',
          linesAdded: 8,
          linesDeleted: 2,
          diffSummary: 'Updated markdown documentation on retry policies.'
        }
      ]
    },
    graph: CONTROLLED_MICROSERVICE_GRAPH,
    risk: {
      score: 12,
      level: 'LOW',
      confidence: 0.98,
      modelId: 'temporal-gnn-release-v2.1',
      modelVersion: 'v2.1.0',
      calibratedProbability: 0.05
    },
    blastRadius: {
      score: 5,
      directCount: 0,
      indirectCount: 0,
      criticalCount: 0,
      externalDependencyCount: 0,
      maxDepth: 0,
      runtimeTrafficExposureReqPerSec: 0,
      summary: 'Isolated documentation change with zero downstream code or database coupling.'
    },
    affectedComponents: [],
    evidence: [
      {
        id: 'ev-doc-only',
        type: 'change',
        sourceReference: 'git:diff/a301d4187e',
        timestamp: '2026-09-17T08:29:00Z',
        summary: 'All changes restricted to markdown documentation files (*.md).',
        weight: 0.95,
        relatedEntityIds: []
      }
    ],
    recommendedTests: [
      {
        id: 't-lint-doc',
        name: 'DocumentationLintTest.testMarkdownAnchors()',
        suite: 'lint/docs',
        type: 'unit',
        priority: 'P2',
        score: 0.25,
        mappedComponentIds: [],
        reason: 'Basic markdown link and formatting verification.',
        estimatedDurationMs: 950
      }
    ],
    testMetrics: {
      totalSuiteCount: 384,
      selectedCount: 1,
      testReductionPercent: 99.7,
      estimatedTimeSavedSeconds: 435,
      projectedFailureDetectionRetained: 100.0
    },
    whatIfScenarios: [
      {
        id: 'sc-doc-normal',
        type: 'NORMAL',
        name: 'Standard Direct Rollout',
        description: 'Merge and publish documentation updates directly.',
        estimatedRiskScore: 12,
        estimatedExposure: 'LOW',
        residualRisk: 'MINIMAL',
        assumptions: ['No binary or container artifacts affected.'],
        recommendedActions: ['Safe to merge and deploy immediately.']
      }
    ],
    explanation: {
      summary: 'Low Risk (Score 12/100). Isolated documentation modification.',
      whyRisky: 'The change is restricted to markdown files with zero runtime execution impact or dependency changes.',
      traceableEvidenceIds: ['ev-doc-only'],
      suggestedMitigation: 'Standard PR approval and automated merge.',
      generatedBy: 'DETERMINISTIC_GROUNDED_ENGINE'
    },
    releaseDecision: {
      status: 'RELEASE',
      decidedBy: 'tech.lead@company.internal',
      timestamp: '2026-09-17T08:35:00Z',
      rationale: 'Direct merge approved.'
    },
    actualOutcome: {
      recordedAt: '2026-09-17T08:40:00Z',
      deploymentStatus: 'SUCCESS',
      incidentOccurred: false,
      failedTestIds: [],
      observedAffectedComponents: [],
      latencyDeltaPercent: 0.0,
      errorRateDeltaPercent: 0.0
    }
  },
  'college-commit-enrollment': COLLEGE_MANAGEMENT_ANALYSIS,
  'banking-commit-aml': BANKING_ANALYSIS,
  'saas-commit-quota': SAAS_ANALYSIS
};

export const BENCHMARK_EXPERIMENTS: ExperimentRun[] = [
  {
    id: 'exp-001',
    experimentCode: 'EXP-001',
    name: 'B1: Static Dependency Traversal Baseline',
    modelBaseline: 'B1_STATIC',
    datasetVersion: 'dataset-eval-v1.0',
    splitVersion: 'chronological-split-2026Q3',
    metrics: {
      precision: 0.48,
      recall: 0.62,
      f1: 0.54,
      auroc: 0.61,
      prAuc: 0.52,
      affectedRecall: 0.59,
      testReductionPercent: 45.2,
      failureDetectionRetained: 78.4,
      inferenceLatencyMs: 14
    }
  },
  {
    id: 'exp-002',
    experimentCode: 'EXP-002',
    name: 'B2: Rule-Based Scoring Baseline (Heuristics)',
    modelBaseline: 'B2_RULE',
    datasetVersion: 'dataset-eval-v1.0',
    splitVersion: 'chronological-split-2026Q3',
    metrics: {
      precision: 0.59,
      recall: 0.68,
      f1: 0.63,
      auroc: 0.69,
      prAuc: 0.61,
      affectedRecall: 0.66,
      testReductionPercent: 61.4,
      failureDetectionRetained: 82.1,
      inferenceLatencyMs: 22
    }
  },
  {
    id: 'exp-003',
    experimentCode: 'EXP-003',
    name: 'B3: Traditional ML (XGBoost on Engineered Features)',
    modelBaseline: 'B3_TRADITIONAL_ML',
    datasetVersion: 'dataset-eval-v1.0',
    splitVersion: 'chronological-split-2026Q3',
    metrics: {
      precision: 0.73,
      recall: 0.77,
      f1: 0.75,
      auroc: 0.81,
      prAuc: 0.74,
      affectedRecall: 0.72,
      testReductionPercent: 74.8,
      failureDetectionRetained: 89.2,
      inferenceLatencyMs: 38
    }
  },
  {
    id: 'exp-004',
    experimentCode: 'EXP-004',
    name: 'B4: Non-Temporal Graph ML (GraphSAGE / GAT)',
    modelBaseline: 'B4_GRAPH_ML',
    datasetVersion: 'dataset-eval-v1.0',
    splitVersion: 'chronological-split-2026Q3',
    metrics: {
      precision: 0.81,
      recall: 0.84,
      f1: 0.82,
      auroc: 0.88,
      prAuc: 0.83,
      affectedRecall: 0.86,
      testReductionPercent: 82.5,
      failureDetectionRetained: 93.6,
      inferenceLatencyMs: 65
    }
  },
  {
    id: 'exp-005',
    experimentCode: 'EXP-005',
    name: 'B5: Proposed Temporal Graph ML (Time-Aware Graph + Runtime + History)',
    modelBaseline: 'B5_TEMPORAL_GRAPH_ML',
    datasetVersion: 'dataset-eval-v1.0',
    splitVersion: 'chronological-split-2026Q3',
    metrics: {
      precision: 0.89,
      recall: 0.92,
      f1: 0.90,
      auroc: 0.94,
      prAuc: 0.91,
      affectedRecall: 0.93,
      testReductionPercent: 88.4,
      failureDetectionRetained: 97.4,
      inferenceLatencyMs: 92
    },
    ablations: [
      { configName: 'A0: Full Proposed System (Temporal GNN + RT + History)', f1: 0.90, recall: 0.92, auroc: 0.94, affectedRecall: 0.93 },
      { configName: 'A1: Without Runtime Telemetry (Static + History + Time)', f1: 0.83, recall: 0.85, auroc: 0.87, affectedRecall: 0.84 },
      { configName: 'A2: Without Historical Incidents (Static + RT + Time)', f1: 0.81, recall: 0.82, auroc: 0.85, affectedRecall: 0.83 },
      { configName: 'A3: Without Temporal Modeling (Non-temporal snapshot)', f1: 0.82, recall: 0.84, auroc: 0.88, affectedRecall: 0.86 },
      { configName: 'A4: Without Graph Structure (Tabular ML only)', f1: 0.75, recall: 0.77, auroc: 0.81, affectedRecall: 0.72 },
      { configName: 'A5: Without Criticality Weighting', f1: 0.86, recall: 0.88, auroc: 0.90, affectedRecall: 0.89 }
    ]
  }
];
