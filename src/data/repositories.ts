import { SoftwareGraph, AnalysisResult, GraphNode, GraphEdge } from '../types.ts';
import { RepositorySummary, RepositoryCommit } from '../types/repository.ts';

// ==========================================
// 1. REPOSITORY A: COLLEGE MANAGEMENT SYSTEM
// ==========================================
export const COLLEGE_MANAGEMENT_GRAPH: SoftwareGraph = {
  timestamp: '2026-09-17T09:00:00Z',
  snapshotId: 'snap-college-v2.1',
  nodes: [
    { id: 'col-gw', type: 'Service', name: 'Campus API Gateway', criticality: 'CRITICAL', status: 'healthy' },
    { id: 'col-api-enroll', type: 'API', name: 'POST /v2/students/enroll', criticality: 'CRITICAL', metadata: { path: '/v2/students/enroll', method: 'POST' } },
    { id: 'col-srv-student', type: 'Service', name: 'Student Management Service', criticality: 'CRITICAL', status: 'healthy' },
    { id: 'col-fn-enroll', type: 'Function', name: 'StudentService.validateEnrollmentEligibility()', criticality: 'CRITICAL', isChanged: true },
    { id: 'col-db-course', type: 'Database', name: 'Curriculum & Courses DB', criticality: 'HIGH', metadata: { engine: 'PostgreSQL 16' } },
    { id: 'col-srv-fees', type: 'Service', name: 'Fee Ledger & Billing Service', criticality: 'HIGH', status: 'healthy' },
    { id: 'col-fn-dues', type: 'Function', name: 'BillingService.checkOutstandingDues()', criticality: 'HIGH' },
    { id: 'col-queue-alerts', type: 'Queue', name: 'RabbitMQ academic.notifications', criticality: 'MEDIUM' },
    { id: 'col-srv-notify', type: 'Service', name: 'Campus Notification Service', criticality: 'MEDIUM', status: 'healthy' },
    { id: 'col-ext-sis', type: 'ExternalService', name: 'National Student Clearinghouse (SIS)', criticality: 'HIGH' },
    { id: 'col-db-audit', type: 'Database', name: 'Academic Audit Records DB', criticality: 'LOW' },
    { id: 'col-srv-exam', type: 'Service', name: 'Examination & Grading Service', criticality: 'HIGH', status: 'healthy' }
  ],
  edges: [
    { id: 'c-e1', source: 'col-gw', target: 'col-api-enroll', type: 'EXPOSES', sourceType: 'static' },
    { id: 'c-e2', source: 'col-api-enroll', target: 'col-srv-student', type: 'CALLS_API', sourceType: 'static' },
    { id: 'c-e3', source: 'col-srv-student', target: 'col-fn-enroll', type: 'CONTAINS', sourceType: 'static' },
    { id: 'c-e4', source: 'col-fn-enroll', target: 'col-db-course', type: 'READS', sourceType: 'static' },
    { id: 'c-e5', source: 'col-fn-enroll', target: 'col-srv-fees', type: 'CALLS', sourceType: 'static' },
    { id: 'c-e6', source: 'col-srv-fees', target: 'col-fn-dues', type: 'CONTAINS', sourceType: 'static' },
    { id: 'c-e7', source: 'col-fn-enroll', target: 'col-queue-alerts', type: 'PUBLISHES', sourceType: 'static' },
    { id: 'c-e8', source: 'col-queue-alerts', target: 'col-srv-notify', type: 'CONSUMES', sourceType: 'static' },
    { id: 'c-e9', source: 'col-srv-student', target: 'col-ext-sis', type: 'CALLS_API', sourceType: 'static' },
    { id: 'c-e10', source: 'col-srv-student', target: 'col-db-audit', type: 'WRITES', sourceType: 'static' },
    { id: 'c-e11', source: 'col-srv-student', target: 'col-srv-exam', type: 'CALLS', sourceType: 'static' },
    // Runtime telemetry observed calls prior to T0
    { 
      id: 'c-rt-1', source: 'col-gw', target: 'col-srv-student', type: 'OBSERVED_CALL', sourceType: 'runtime', 
      observationCount: 8400, weight: 0.94, metadata: { rps: 340, p95_latency_ms: 32 } 
    },
    { 
      id: 'c-rt-2', source: 'col-srv-student', target: 'col-srv-fees', type: 'OBSERVED_CALL', sourceType: 'runtime', 
      observationCount: 5200, weight: 0.88, metadata: { rps: 210, p95_latency_ms: 110 } 
    },
    { 
      id: 'c-rt-3', source: 'col-srv-student', target: 'col-queue-alerts', type: 'OBSERVED_CALL', sourceType: 'runtime', 
      observationCount: 7100, weight: 0.91, metadata: { rps: 290, p95_latency_ms: 22 } 
    }
  ]
};

export const COLLEGE_MANAGEMENT_ANALYSIS: AnalysisResult = {
  analysisId: 'an-col-901',
  repositoryId: 'repo-college-mgmt',
  commitSha: 'f901c82e04',
  predictionTimeT0: '2026-09-17T09:00:00Z',
  status: 'COMPLETED',
  changeSummary: {
    message: 'feat(enrollment): update student enrollment validation logic and prerequisite checks',
    author: 'academic.tech@university.edu',
    changeType: 'BUSINESS_LOGIC',
    filesChanged: 3,
    insertions: 54,
    deletions: 16,
    entities: [
      {
        id: 'c-ent-1',
        type: 'function',
        name: 'StudentService.validateEnrollmentEligibility()',
        path: 'src/services/StudentService.ts',
        changeKind: 'modified',
        linesAdded: 38,
        linesDeleted: 11,
        diffSummary: 'Added strict prerequisite grade cutoff and outstanding fee validation gate.'
      },
      {
        id: 'c-ent-2',
        type: 'schema',
        name: 'courses.prerequisites (minimum_gpa constraint)',
        path: 'database/migrations/20260917_prereq_rules.sql',
        changeKind: 'modified',
        linesAdded: 16,
        linesDeleted: 5,
        diffSummary: 'Added minimum GPA constraint and course audit triggers.'
      }
    ]
  },
  graph: COLLEGE_MANAGEMENT_GRAPH,
  risk: {
    score: 78,
    level: 'HIGH',
    confidence: 0.88,
    modelId: 'temporal-gnn-release-v2.1',
    modelVersion: 'v2.1.0',
    calibratedProbability: 0.81
  },
  blastRadius: {
    score: 74,
    directCount: 3,
    indirectCount: 4,
    criticalCount: 2,
    externalDependencyCount: 1,
    maxDepth: 3,
    runtimeTrafficExposureReqPerSec: 640,
    summary: 'Direct dependency propagation to Course DB, Fee Ledger Service, and Notification Queue.'
  },
  affectedComponents: [
    {
      id: 'col-aff-1',
      nodeId: 'col-srv-student',
      name: 'Student Management Service',
      type: 'Service',
      impactType: 'DIRECT',
      impactScore: 94,
      criticality: 'CRITICAL',
      pathFromChange: ['StudentService.validateEnrollmentEligibility()', 'Student Management Service'],
      evidenceIds: ['col-ev-code', 'col-ev-rt-1'],
      reason: 'Contains modified enrollment validation logic; handles all student portal admission traffic.'
    },
    {
      id: 'col-aff-2',
      nodeId: 'col-srv-fees',
      name: 'Fee Ledger & Billing Service',
      type: 'Service',
      impactType: 'DIRECT',
      impactScore: 82,
      criticality: 'HIGH',
      pathFromChange: ['StudentService.validateEnrollmentEligibility()', 'Fee Ledger & Billing Service'],
      evidenceIds: ['col-ev-rt-2', 'col-ev-inc-94'],
      reason: 'Synchronously invoked to verify student balance before finalizing course registration.'
    },
    {
      id: 'col-aff-3',
      nodeId: 'col-queue-alerts',
      name: 'RabbitMQ academic.notifications',
      type: 'Queue',
      impactType: 'DIRECT',
      impactScore: 76,
      criticality: 'MEDIUM',
      pathFromChange: ['StudentService.validateEnrollmentEligibility()', 'RabbitMQ academic.notifications'],
      evidenceIds: ['col-ev-inc-94'],
      reason: 'Asynchronous event channel for admission confirmation alerts and student portal pushes.'
    },
    {
      id: 'col-aff-4',
      nodeId: 'col-srv-notify',
      name: 'Campus Notification Service',
      type: 'Service',
      impactType: 'INDIRECT',
      impactScore: 68,
      criticality: 'MEDIUM',
      pathFromChange: ['StudentService.validateEnrollmentEligibility()', 'RabbitMQ academic.notifications', 'Campus Notification Service'],
      evidenceIds: ['col-ev-inc-94'],
      reason: 'Processes dispatch of automated email and SMS confirmations to newly registered students.'
    },
    {
      id: 'col-aff-5',
      nodeId: 'col-ext-sis',
      name: 'National Student Clearinghouse (SIS)',
      type: 'ExternalService',
      impactType: 'INDIRECT',
      impactScore: 62,
      criticality: 'HIGH',
      pathFromChange: ['StudentService.validateEnrollmentEligibility()', 'Student Management Service', 'National Student Clearinghouse (SIS)'],
      evidenceIds: ['col-ev-rt-1'],
      reason: 'External federal student reporting webhook called on confirmed enrollment state transition.'
    }
  ],
  evidence: [
    {
      id: 'col-ev-code',
      type: 'change',
      sourceReference: 'StudentService.ts:142',
      timestamp: '2026-09-17T08:52:00Z',
      summary: 'Modified validation conditions in validateEnrollmentEligibility() introducing synchronous dues check.',
      weight: 0.92,
      relatedEntityIds: ['col-fn-enroll', 'col-srv-student']
    },
    {
      id: 'col-ev-rt-1',
      type: 'runtime',
      sourceReference: 'OpenTelemetry Trace #sis-trace-892',
      timestamp: '2026-09-17T08:58:00Z',
      summary: 'Student Gateway observed routing 340 req/s during active semester registration window.',
      weight: 0.86,
      relatedEntityIds: ['col-gw', 'col-srv-student']
    },
    {
      id: 'col-ev-inc-94',
      type: 'history',
      sourceReference: 'Incident INC-COL-094 (2026-04-12)',
      timestamp: '2026-04-12T14:20:00Z',
      summary: 'Prior changes to student enrollment checks triggered a cascade timeout in the Fee Ledger service.',
      weight: 0.89,
      relatedEntityIds: ['col-srv-fees', 'col-queue-alerts']
    }
  ],
  recommendedTests: [
    {
      id: 'col-t1',
      name: 'StudentEnrollmentValidatorTest.testPrerequisiteCutoff',
      suite: 'academic-core-unit',
      type: 'unit',
      priority: 'P0',
      score: 98,
      mappedComponentIds: ['col-fn-enroll'],
      reason: 'Direct test coverage of the modified GPA and prerequisite validation logic.',
      estimatedDurationMs: 380,
      historicalFailureCorrelation: 0.94
    },
    {
      id: 'col-t2',
      name: 'FeeLedgerSyncIntegrationTest.testDuesVerificationLock',
      suite: 'billing-integration',
      type: 'integration',
      priority: 'P0',
      score: 94,
      mappedComponentIds: ['col-srv-fees', 'col-fn-dues'],
      reason: 'Verifies synchronous locking when querying student fee status during enrollment.',
      estimatedDurationMs: 1450,
      historicalFailureCorrelation: 0.91
    },
    {
      id: 'col-t3',
      name: 'NotificationEventE2ETest.testEnrollmentConfirmationDispatch',
      suite: 'campus-notifications-e2e',
      type: 'e2e',
      priority: 'P0',
      score: 89,
      mappedComponentIds: ['col-queue-alerts', 'col-srv-notify'],
      reason: 'End-to-end assertion that student notification payload matches expected schema.',
      estimatedDurationMs: 3200,
      historicalFailureCorrelation: 0.82
    },
    {
      id: 'col-t4',
      name: 'SisClearinghouseSyncTest.testExternalReportingPayload',
      suite: 'external-compliance',
      type: 'integration',
      priority: 'P1',
      score: 75,
      mappedComponentIds: ['col-ext-sis'],
      reason: 'Regression validation of external federal education reporting payload.',
      estimatedDurationMs: 1800
    },
    {
      id: 'col-t5',
      name: 'CourseAuditTrailTest.testConstraintEnforcement',
      suite: 'curriculum-db-test',
      type: 'unit',
      priority: 'P1',
      score: 71,
      mappedComponentIds: ['col-db-course'],
      reason: 'Ensures course enrollment capacity and prerequisite constraints in DB.',
      estimatedDurationMs: 420
    }
  ],
  testMetrics: {
    totalSuiteCount: 64,
    selectedCount: 12,
    testReductionPercent: 81.25,
    estimatedTimeSavedSeconds: 1420,
    projectedFailureDetectionRetained: 97.8
  },
  whatIfScenarios: [
    {
      id: 'col-wi-1',
      type: 'NORMAL',
      name: 'Direct Full Deployment',
      description: 'Promote new enrollment rules directly to 100% of student traffic.',
      estimatedRiskScore: 78,
      estimatedExposure: 'HIGH',
      residualRisk: 'HIGH',
      assumptions: ['All 25,000 active students exposed immediately.', 'Registration peak traffic.'],
      recommendedActions: ['Not recommended during open registration week.']
    },
    {
      id: 'col-wi-2',
      type: 'CANARY_10',
      name: 'Canary 10% (Graduate School Only)',
      description: 'Deploy solely to the Graduate School student cohort with 10% load.',
      estimatedRiskScore: 32,
      estimatedExposure: 'CONTROLLED',
      residualRisk: 'LOW',
      assumptions: ['Automated rollback on fee ledger timeout spikes > 2%.', '10% student traffic limit.'],
      recommendedActions: ['Recommended strategy. Monitor Fee Ledger p95 latency for 30 minutes.']
    },
    {
      id: 'col-wi-3',
      type: 'FEATURE_FLAG',
      name: 'Feature Flag Dark Launch',
      description: 'Execute new eligibility calculations in shadow mode without blocking registrations.',
      estimatedRiskScore: 16,
      estimatedExposure: 'LOW',
      residualRisk: 'MINIMAL',
      assumptions: ['Shadow log comparison without blocking active student enrollments.'],
      recommendedActions: ['Zero risk to live admissions. Validates accuracy over 24h.']
    }
  ],
  explanation: {
    summary: 'HIGH Risk (Score 78/100). Modifying validateEnrollmentEligibility() creates a critical propagation path into the Fee Ledger Service and Notification Queue.',
    whyRisky: 'The modified enrollment logic synchronously interacts with the Fee Ledger Service [col-ev-code] while handling active registration traffic of 340 req/s [col-ev-rt-1]. Historical incident INC-COL-094 demonstrates that similar changes previously triggered fee service latency degradation.',
    traceableEvidenceIds: ['col-ev-code', 'col-ev-rt-1', 'col-ev-inc-94'],
    suggestedMitigation: 'Run the 3 designated P0 verification tests. Deploy with a 10% canary to the Graduate School cohort before opening general campus enrollment.',
    uncertaintyNotice: 'Demo dataset. Prediction calibrated with prototype Temporal GNN message passing.',
    generatedBy: 'DETERMINISTIC_GROUNDED_ENGINE'
  }
};

// ==========================================
// 2. REPOSITORY B: BANKING & CORE LEDGER
// ==========================================
export const BANKING_GRAPH: SoftwareGraph = {
  timestamp: '2026-09-17T09:00:00Z',
  snapshotId: 'snap-banking-v3.0',
  nodes: [
    { id: 'bnk-auth', type: 'Service', name: 'MFA & OAuth Token Authority', criticality: 'CRITICAL', status: 'healthy' },
    { id: 'bnk-api-tx', type: 'API', name: 'POST /v3/transfers/wire', criticality: 'CRITICAL', metadata: { method: 'POST', path: '/v3/transfers/wire' } },
    { id: 'bnk-srv-account', type: 'Service', name: 'Account Balance & Validation Service', criticality: 'CRITICAL', status: 'healthy' },
    { id: 'bnk-srv-tx', type: 'Service', name: 'Transaction Orchestrator Service', criticality: 'CRITICAL', status: 'degraded' },
    { id: 'bnk-fn-validate', type: 'Function', name: 'TransferValidator.validateAMLAndLimits()', criticality: 'CRITICAL', isChanged: true },
    { id: 'bnk-db-ledger', type: 'Database', name: 'Immutable Financial Ledger DB', criticality: 'CRITICAL', metadata: { isolation: 'SERIALIZABLE' } },
    { id: 'bnk-queue-fraud', type: 'Queue', name: 'Kafka transactions.realtime Topic', criticality: 'HIGH' },
    { id: 'bnk-srv-fraud', type: 'Service', name: 'Real-Time Fraud Detection Engine', criticality: 'CRITICAL', status: 'healthy' },
    { id: 'bnk-ext-swift', type: 'ExternalService', name: 'SWIFT / Fedwire Network API', criticality: 'CRITICAL' },
    { id: 'bnk-srv-notify', type: 'Service', name: 'Customer Push & SMS Notification Service', criticality: 'MEDIUM', status: 'healthy' }
  ],
  edges: [
    { id: 'b-e1', source: 'bnk-auth', target: 'bnk-api-tx', type: 'CALLS_API', sourceType: 'static' },
    { id: 'b-e2', source: 'bnk-api-tx', target: 'bnk-srv-tx', type: 'CALLS_API', sourceType: 'static' },
    { id: 'b-e3', source: 'bnk-srv-tx', target: 'bnk-srv-account', type: 'CALLS', sourceType: 'static' },
    { id: 'b-e4', source: 'bnk-srv-tx', target: 'bnk-fn-validate', type: 'CONTAINS', sourceType: 'static' },
    { id: 'b-e5', source: 'bnk-fn-validate', target: 'bnk-db-ledger', type: 'WRITES', sourceType: 'static' },
    { id: 'b-e6', source: 'bnk-srv-tx', target: 'bnk-queue-fraud', type: 'PUBLISHES', sourceType: 'static' },
    { id: 'b-e7', source: 'bnk-queue-fraud', target: 'bnk-srv-fraud', type: 'CONSUMES', sourceType: 'static' },
    { id: 'b-e8', source: 'bnk-srv-tx', target: 'bnk-ext-swift', type: 'CALLS_API', sourceType: 'static' },
    { id: 'b-e9', source: 'bnk-srv-tx', target: 'bnk-srv-notify', type: 'CALLS', sourceType: 'static' },
    // Runtime telemetry observed prior to T0
    { 
      id: 'b-rt-1', source: 'bnk-srv-tx', target: 'bnk-db-ledger', type: 'OBSERVED_CALL', sourceType: 'runtime',
      observationCount: 34000, weight: 0.99, metadata: { rps: 1450, lock_wait_ms: 22 }
    },
    { 
      id: 'b-rt-2', source: 'bnk-srv-tx', target: 'bnk-queue-fraud', type: 'OBSERVED_CALL', sourceType: 'runtime',
      observationCount: 32000, weight: 0.95, metadata: { rps: 1400, lag_ms: 5 }
    }
  ]
};

export const BANKING_ANALYSIS: AnalysisResult = {
  analysisId: 'an-bnk-772',
  repositoryId: 'repo-banking-core',
  commitSha: 'b772d119c8',
  predictionTimeT0: '2026-09-17T09:00:00Z',
  status: 'COMPLETED',
  changeSummary: {
    message: 'security(aml): update high-value wire transaction validation thresholds and sanction checks',
    author: 'fintech.compliance@secure-bank.com',
    changeType: 'SECURITY',
    filesChanged: 2,
    insertions: 39,
    deletions: 8,
    entities: [
      {
        id: 'b-ent-1',
        type: 'function',
        name: 'TransferValidator.validateAMLAndLimits()',
        path: 'src/compliance/TransferValidator.ts',
        changeKind: 'modified',
        linesAdded: 28,
        linesDeleted: 6,
        diffSummary: 'Adjusted AML risk scoring formula and added strict sanction screening hook.'
      }
    ]
  },
  graph: BANKING_GRAPH,
  risk: {
    score: 92,
    level: 'CRITICAL',
    confidence: 0.93,
    modelId: 'temporal-gnn-release-v2.1',
    modelVersion: 'v2.1.0',
    calibratedProbability: 0.91
  },
  blastRadius: {
    score: 89,
    directCount: 3,
    indirectCount: 3,
    criticalCount: 4,
    externalDependencyCount: 1,
    maxDepth: 3,
    runtimeTrafficExposureReqPerSec: 1450,
    summary: 'Direct critical impact on Financial Ledger DB, Real-Time Fraud Engine, and SWIFT Network.'
  },
  affectedComponents: [
    {
      id: 'bnk-aff-1',
      nodeId: 'bnk-srv-tx',
      name: 'Transaction Orchestrator Service',
      type: 'Service',
      impactType: 'DIRECT',
      impactScore: 97,
      criticality: 'CRITICAL',
      pathFromChange: ['TransferValidator.validateAMLAndLimits()', 'Transaction Orchestrator Service'],
      evidenceIds: ['bnk-ev-code'],
      reason: 'Core settlement service executing the modified anti-money-laundering validation routines.'
    },
    {
      id: 'bnk-aff-2',
      nodeId: 'bnk-db-ledger',
      name: 'Immutable Financial Ledger DB',
      type: 'Database',
      impactType: 'DIRECT',
      impactScore: 94,
      criticality: 'CRITICAL',
      pathFromChange: ['TransferValidator.validateAMLAndLimits()', 'Immutable Financial Ledger DB'],
      evidenceIds: ['bnk-ev-rt-1'],
      reason: 'Stores verified double-entry accounting transactions; uses strict serializable isolation.'
    },
    {
      id: 'bnk-aff-3',
      nodeId: 'bnk-srv-fraud',
      name: 'Real-Time Fraud Detection Engine',
      type: 'Service',
      impactType: 'INDIRECT',
      impactScore: 88,
      criticality: 'CRITICAL',
      pathFromChange: ['TransferValidator.validateAMLAndLimits()', 'Kafka transactions.realtime Topic', 'Real-Time Fraud Detection Engine'],
      evidenceIds: ['bnk-ev-rt-2'],
      reason: 'Synchronizes risk evaluations from downstream fraud streaming consumers.'
    }
  ],
  evidence: [
    {
      id: 'bnk-ev-code',
      type: 'change',
      sourceReference: 'TransferValidator.ts:89',
      timestamp: '2026-09-17T08:45:00Z',
      summary: 'Modified AML threshold evaluation logic in TransferValidator.',
      weight: 0.95,
      relatedEntityIds: ['bnk-fn-validate']
    },
    {
      id: 'bnk-ev-rt-1',
      type: 'runtime',
      sourceReference: 'OpenTelemetry Trace #ledger-commit-81',
      timestamp: '2026-09-17T08:55:00Z',
      summary: 'Ledger DB write latency currently at 22ms under 1450 wire transfers per second.',
      weight: 0.91,
      relatedEntityIds: ['bnk-db-ledger']
    }
  ],
  recommendedTests: [
    {
      id: 'bnk-t1',
      name: 'AmlSanctionValidationTest.testHighValueThresholdExemption',
      suite: 'compliance-audit-suite',
      type: 'unit',
      priority: 'P0',
      score: 99,
      mappedComponentIds: ['bnk-fn-validate'],
      reason: 'Validates AML logic changes and legal compliance boundary conditions.',
      estimatedDurationMs: 450
    },
    {
      id: 'bnk-t2',
      name: 'LedgerSerializableIsolationTest.testConcurrentTransfers',
      suite: 'ledger-persistence-suite',
      type: 'integration',
      priority: 'P0',
      score: 95,
      mappedComponentIds: ['bnk-db-ledger'],
      reason: 'Ensures zero double-spending or isolation degradation during high volume transfer validation.',
      estimatedDurationMs: 2400
    }
  ],
  testMetrics: {
    totalSuiteCount: 94,
    selectedCount: 18,
    testReductionPercent: 80.85,
    estimatedTimeSavedSeconds: 2200,
    projectedFailureDetectionRetained: 99.1
  },
  whatIfScenarios: [
    {
      id: 'bnk-wi-1',
      type: 'NORMAL',
      name: 'Direct Release',
      description: 'Release to entire banking core simultaneously.',
      estimatedRiskScore: 92,
      estimatedExposure: 'HIGH',
      residualRisk: 'HIGH',
      assumptions: ['All interbank transfer operations exposed.'],
      recommendedActions: ['Prohibited by financial compliance policy.']
    },
    {
      id: 'bnk-wi-2',
      type: 'CANARY_10',
      name: 'Internal Employee Account Canary (5%)',
      description: 'Limit initial deployment strictly to internal test accounts for 2 hours.',
      estimatedRiskScore: 24,
      estimatedExposure: 'CONTROLLED',
      residualRisk: 'LOW',
      assumptions: ['Audit validation with live Fedwire sandbox integration.'],
      recommendedActions: ['Approved compliance procedure.']
    }
  ],
  explanation: {
    summary: 'CRITICAL Risk (Score 92/100). Changes to AML validation directly govern high-value wire transfers and ledger commits.',
    whyRisky: 'TransferValidator.validateAMLAndLimits() sits directly in front of the Immutable Ledger DB and the Fedwire / SWIFT interface. Any miscalculation could trigger immediate compliance holds or transaction stalls across $12M/minute volume.',
    traceableEvidenceIds: ['bnk-ev-code', 'bnk-ev-rt-1'],
    suggestedMitigation: 'Execute mandatory P0 compliance test suites. Mandate dual release engineering authorization and deploy to employee-only canary tier.',
    uncertaintyNotice: 'Demo dataset for repository-agnostic evaluation.',
    generatedBy: 'DETERMINISTIC_GROUNDED_ENGINE'
  }
};

// ==========================================
// 3. REPOSITORY C: SAAS CLOUD PLATFORM
// ==========================================
export const SAAS_GRAPH: SoftwareGraph = {
  timestamp: '2026-09-17T09:00:00Z',
  snapshotId: 'snap-saas-v4.0',
  nodes: [
    { id: 'saas-gw', type: 'Service', name: 'Edge Ingress Gateway (Envoy)', criticality: 'CRITICAL', status: 'healthy' },
    { id: 'saas-api-tenant', type: 'API', name: 'PATCH /v1/organizations/{id}/tier', criticality: 'HIGH' },
    { id: 'saas-srv-tenant', type: 'Service', name: 'Tenant Provisioning Service', criticality: 'HIGH', status: 'healthy' },
    { id: 'saas-fn-quota', type: 'Function', name: 'QuotaManager.recalculateSeatLimits()', criticality: 'HIGH', isChanged: true },
    { id: 'saas-db-tenants', type: 'Database', name: 'Multi-Tenant Metastore (CockroachDB)', criticality: 'CRITICAL' },
    { id: 'saas-srv-usage', type: 'Service', name: 'Usage Metering & Invoicing Service', criticality: 'MEDIUM', status: 'healthy' },
    { id: 'saas-queue-sync', type: 'Queue', name: 'Redis Streams tenant.lifecycle', criticality: 'MEDIUM' }
  ],
  edges: [
    { id: 's-e1', source: 'saas-gw', target: 'saas-api-tenant', type: 'EXPOSES', sourceType: 'static' },
    { id: 's-e2', source: 'saas-api-tenant', target: 'saas-srv-tenant', type: 'CALLS_API', sourceType: 'static' },
    { id: 's-e3', source: 'saas-srv-tenant', target: 'saas-fn-quota', type: 'CONTAINS', sourceType: 'static' },
    { id: 's-e4', source: 'saas-fn-quota', target: 'saas-db-tenants', type: 'WRITES', sourceType: 'static' },
    { id: 's-e5', source: 'saas-srv-tenant', target: 'saas-queue-sync', type: 'PUBLISHES', sourceType: 'static' },
    { id: 's-e6', source: 'saas-queue-sync', target: 'saas-srv-usage', type: 'CONSUMES', sourceType: 'static' }
  ]
};

export const SAAS_ANALYSIS: AnalysisResult = {
  analysisId: 'an-saas-412',
  repositoryId: 'repo-saas-cloud',
  commitSha: 'e412a99105',
  predictionTimeT0: '2026-09-17T09:00:00Z',
  status: 'COMPLETED',
  changeSummary: {
    message: 'refactor(tenancy): recalculate seat limits and tier entitlement caching',
    author: 'cloud-platform@saas-inc.io',
    changeType: 'BUSINESS_LOGIC',
    filesChanged: 2,
    insertions: 22,
    deletions: 7,
    entities: [
      {
        id: 's-ent-1',
        type: 'function',
        name: 'QuotaManager.recalculateSeatLimits()',
        path: 'src/tenancy/QuotaManager.ts',
        changeKind: 'modified',
        linesAdded: 18,
        linesDeleted: 5,
        diffSummary: 'Adjusted organization seat cap calculation logic and Redis cache invalidation.'
      }
    ]
  },
  graph: SAAS_GRAPH,
  risk: {
    score: 42,
    level: 'MEDIUM',
    confidence: 0.85,
    modelId: 'temporal-gnn-release-v2.1',
    modelVersion: 'v2.1.0',
    calibratedProbability: 0.40
  },
  blastRadius: {
    score: 38,
    directCount: 2,
    indirectCount: 2,
    criticalCount: 1,
    externalDependencyCount: 0,
    maxDepth: 2,
    runtimeTrafficExposureReqPerSec: 180,
    summary: 'Localized blast radius affecting Tenant Metastore and Usage Metering Service.'
  },
  affectedComponents: [
    {
      id: 'saas-aff-1',
      nodeId: 'saas-srv-tenant',
      name: 'Tenant Provisioning Service',
      type: 'Service',
      impactType: 'DIRECT',
      impactScore: 72,
      criticality: 'HIGH',
      pathFromChange: ['QuotaManager.recalculateSeatLimits()', 'Tenant Provisioning Service'],
      evidenceIds: [],
      reason: 'Handles organization upgrade workflows and seat entitlement updates.'
    }
  ],
  evidence: [
    {
      id: 'saas-ev-1',
      type: 'change',
      sourceReference: 'QuotaManager.ts:45',
      timestamp: '2026-09-17T08:30:00Z',
      summary: 'Modified seat allocation recalculation for enterprise tier customers.',
      weight: 0.78,
      relatedEntityIds: ['saas-fn-quota']
    }
  ],
  recommendedTests: [
    {
      id: 'saas-t1',
      name: 'SeatQuotaCalculationTest.testEnterpriseAddSeats',
      suite: 'tenant-billing-unit',
      type: 'unit',
      priority: 'P0',
      score: 92,
      mappedComponentIds: ['saas-fn-quota'],
      reason: 'Validates seat allocation edge cases and maximum tenant thresholds.',
      estimatedDurationMs: 250
    }
  ],
  testMetrics: {
    totalSuiteCount: 48,
    selectedCount: 6,
    testReductionPercent: 87.5,
    estimatedTimeSavedSeconds: 680,
    projectedFailureDetectionRetained: 98.2
  },
  whatIfScenarios: [
    {
      id: 'saas-wi-1',
      type: 'NORMAL',
      name: 'Direct Deployment',
      description: 'Standard rolling update across tenant service pods.',
      estimatedRiskScore: 42,
      estimatedExposure: 'CONTROLLED',
      residualRisk: 'LOW',
      assumptions: ['Low traffic window; backward-compatible API schema.'],
      recommendedActions: ['Safe to release with standard unit verification.']
    }
  ],
  explanation: {
    summary: 'MEDIUM Risk (Score 42/100). Moderate blast radius contained inside tenant provisioning.',
    whyRisky: 'Recalculating quota seat limits updates the multi-tenant CockroachDB store, but does not affect customer real-time data plane paths.',
    traceableEvidenceIds: ['saas-ev-1'],
    suggestedMitigation: 'Run the primary P0 unit tests. Stagger pod updates over 10 minutes.',
    uncertaintyNotice: 'Demo dataset for repository-agnostic evaluation.',
    generatedBy: 'DETERMINISTIC_GROUNDED_ENGINE'
  }
};

// ==========================================
// MASTER REPOSITORIES INVENTORY
// ==========================================
export const DEMO_REPOSITORIES: RepositorySummary[] = [
  {
    id: 'repo-college-mgmt',
    name: 'College Management System (CampusOS)',
    category: 'College Management',
    description: 'Student lifecycle, admissions, course enrollment, and fee management platform.',
    languages: ['TypeScript', 'Node.js', 'PostgreSQL'],
    filesCount: 184,
    servicesCount: 6,
    apisCount: 22,
    databasesCount: 2,
    testsCount: 64,
    lastCommitSha: 'f901c82e04',
    lastCommitMessage: 'feat(enrollment): update student enrollment validation logic and prerequisite checks',
    lastCommitTimestamp: '2026-09-17T08:52:00Z',
    health: 'HEALTHY',
    telemetrySource: 'OpenTelemetry (Academic Staging)',
    historicalIncidentCount: 3,
    branch: 'main',
    commits: [
      {
        sha: 'f901c82e04',
        message: 'feat(enrollment): update student enrollment validation logic and prerequisite checks',
        author: 'academic.tech@university.edu',
        timestamp: '2026-09-17T08:52:00Z',
        changeType: 'BUSINESS_LOGIC',
        diffSummary: 'Added strict prerequisite grade cutoff and outstanding fee validation gate.',
        filesChanged: 3,
        insertions: 54,
        deletions: 16,
        analysisKey: 'college-commit-enrollment'
      }
    ]
  },
  {
    id: 'repo-ecommerce-core',
    name: 'E-Commerce Core (Cart & Payment Platform)',
    category: 'E-Commerce',
    description: 'High-throughput checkout, inventory reservation, and payment processing architecture.',
    languages: ['TypeScript', 'Go', 'PostgreSQL', 'Kafka'],
    filesCount: 242,
    servicesCount: 7,
    apisCount: 31,
    databasesCount: 3,
    testsCount: 81,
    lastCommitSha: 'c452f89a91',
    lastCommitMessage: 'refactor(payment): modify calculateTotal() discount and tax rounding rules',
    lastCommitTimestamp: '2026-09-17T08:48:00Z',
    health: 'DEGRADED',
    telemetrySource: 'OpenTelemetry (Production Cluster)',
    historicalIncidentCount: 5,
    branch: 'release/v4.2',
    commits: [
      {
        sha: 'c452f89a91',
        message: 'refactor(payment): modify calculateTotal() discount and tax rounding rules',
        author: 'dev.lead@release-eng.org',
        timestamp: '2026-09-17T08:48:00Z',
        changeType: 'BUSINESS_LOGIC',
        diffSummary: 'Changed currency decimal conversion and VAT calculation order.',
        filesChanged: 2,
        insertions: 48,
        deletions: 19,
        analysisKey: 'commit-452-high-risk'
      }
    ]
  },
  {
    id: 'repo-banking-core',
    name: 'Core Banking Ledger & Wire System',
    category: 'Banking',
    description: 'Financial accounting, compliance AML validation, and high-value wire transfers.',
    languages: ['Java', 'TypeScript', 'PostgreSQL'],
    filesCount: 310,
    servicesCount: 8,
    apisCount: 42,
    databasesCount: 2,
    testsCount: 94,
    lastCommitSha: 'b772d119c8',
    lastCommitMessage: 'security(aml): update high-value wire transaction validation thresholds and sanction checks',
    lastCommitTimestamp: '2026-09-17T08:45:00Z',
    health: 'HEALTHY',
    telemetrySource: 'OpenTelemetry (Fintech Private VPC)',
    historicalIncidentCount: 2,
    branch: 'main',
    commits: [
      {
        sha: 'b772d119c8',
        message: 'security(aml): update high-value wire transaction validation thresholds and sanction checks',
        author: 'fintech.compliance@secure-bank.com',
        timestamp: '2026-09-17T08:45:00Z',
        changeType: 'SECURITY',
        diffSummary: 'Adjusted AML risk scoring formula and added strict sanction screening hook.',
        filesChanged: 2,
        insertions: 39,
        deletions: 8,
        analysisKey: 'banking-commit-aml'
      }
    ]
  },
  {
    id: 'repo-saas-cloud',
    name: 'Multi-Tenant Cloud SaaS Platform',
    category: 'SaaS',
    description: 'B2B subscription management, tenant isolation, and resource quota provisioning.',
    languages: ['TypeScript', 'Python', 'CockroachDB'],
    filesCount: 160,
    servicesCount: 5,
    apisCount: 18,
    databasesCount: 1,
    testsCount: 48,
    lastCommitSha: 'e412a99105',
    lastCommitMessage: 'refactor(tenancy): recalculate seat limits and tier entitlement caching',
    lastCommitTimestamp: '2026-09-17T08:30:00Z',
    health: 'HEALTHY',
    telemetrySource: 'OpenTelemetry (Cloud K8s)',
    historicalIncidentCount: 1,
    branch: 'main',
    commits: [
      {
        sha: 'e412a99105',
        message: 'refactor(tenancy): recalculate seat limits and tier entitlement caching',
        author: 'cloud-platform@saas-inc.io',
        timestamp: '2026-09-17T08:30:00Z',
        changeType: 'BUSINESS_LOGIC',
        diffSummary: 'Adjusted organization seat cap calculation logic and Redis cache invalidation.',
        filesChanged: 2,
        insertions: 22,
        deletions: 7,
        analysisKey: 'saas-commit-quota'
      }
    ]
  }
];
