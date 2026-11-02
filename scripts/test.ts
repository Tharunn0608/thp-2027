import assert from 'node:assert';
import { db } from '../src/db/store.ts';
import { DEMO_REPOSITORIES } from '../src/data/repositories.ts';
import { PRECONFIGURED_ANALYSES } from '../src/mockData.ts';
import { SoftwareRiskGraphEngine } from '../src/graph/engine.ts';
import { ModelRiskPipeline } from '../src/ml/pipeline.ts';
import { ChangeDetectorService } from '../src/services/changeParser.ts';
import { TestRecommenderEngine } from '../src/services/testRecommender.ts';
import { TemporalLeakageAuditor } from '../src/graph/temporal_auditor.ts';

console.log('====================================================');
console.log('--- RUNNING FULL RESEARCH & FUNCTIONALITY TEST SUITE ---');
console.log('====================================================');

// 1. Check all repositories
assert.strictEqual(DEMO_REPOSITORIES.length >= 4, true);
console.log('✓ Repositories count check passed: ' + DEMO_REPOSITORIES.length + ' connected domains');

// 2. Check each repository has distinct analysis & graph
for (const repo of DEMO_REPOSITORIES) {
  const commit = repo.commits[0];
  assert.ok(commit, `Repo ${repo.id} must have at least one commit`);
  const analysis = PRECONFIGURED_ANALYSES[commit.analysisKey];
  assert.ok(analysis, `Analysis ${commit.analysisKey} must exist for repo ${repo.id}`);
  assert.ok(analysis.graph.nodes.length > 0, `Graph nodes must exist for ${repo.id}`);
  assert.ok(analysis.recommendedTests.length > 0, `Tests must be recommended for ${repo.id}`);
  console.log(`✓ Repository '${repo.name}' verified: ${analysis.graph.nodes.length} nodes, Risk ${analysis.risk.score}/100 (${analysis.risk.level})`);
}

// 3. Bidirectional graph traversal test (Containment Bubbling)
const testGraph = {
  id: 'g-test',
  repositoryId: 'test',
  version: '1.0',
  snapshotId: 'snap-test-01',
  timestamp: '2026-09-17T09:00:00Z',
  nodes: [
    { id: 'fn-a', name: 'innerFunc()', type: 'FUNCTION' as any, criticality: 'HIGH' as any, isChanged: true, metadata: {} },
    { id: 'srv-a', name: 'ServiceA', type: 'SERVICE' as any, criticality: 'CRITICAL' as any, isChanged: false, metadata: {} },
    { id: 'srv-b', name: 'ServiceB', type: 'SERVICE' as any, criticality: 'HIGH' as any, isChanged: false, metadata: {} },
  ],
  edges: [
    { id: 'e1', source: 'srv-a', target: 'fn-a', type: 'CONTAINS' as any, sourceType: 'ast' as any },
    { id: 'e2', source: 'srv-a', target: 'srv-b', type: 'DEPENDS_ON' as any, sourceType: 'ast' as any },
  ]
};
const engine = new SoftwareRiskGraphEngine(testGraph);
const impact = engine.calculateDownstreamImpact('fn-a');
assert.strictEqual(impact.directNodes.some(n => n.id === 'srv-a'), true, 'Parent service must be reachable from inner method');
console.log('✓ Bidirectional traversal verified: inner method bubbles to parent container');

// 4. Temporal Leakage Exclusion
const t0 = '2026-09-17T09:00:00Z';
const pastEdge = { id: 'epast', source: 'srv-a', target: 'srv-b', type: 'DEPENDS_ON' as any, sourceType: 'ast' as any, timestamp: '2026-09-17T08:00:00Z' };
const futureEdge = { id: 'efuture', source: 'srv-a', target: 'srv-b', type: 'DEPENDS_ON' as any, sourceType: 'ast' as any, timestamp: '2026-09-17T10:00:00Z' };
const tempGraph = { ...testGraph, edges: [...testGraph.edges, pastEdge, futureEdge] };
const tempEngine = new SoftwareRiskGraphEngine(tempGraph);
const snapshot = tempEngine.getSnapshotAtT0(t0);
assert.strictEqual(snapshot.edges.some(e => e.id === 'efuture'), false, 'Future event must be excluded');
console.log('✓ Temporal leakage guard verified: post-T0 events strictly purged');

// 5. Change Detection & Unified Diff Parsing
const sampleDiff = `diff --git a/src/controllers/PaymentController.ts b/src/controllers/PaymentController.ts
--- a/src/controllers/PaymentController.ts
+++ b/src/controllers/PaymentController.ts
@@ -10,4 +10,8 @@
+router.post('/v1/charge', async (req, res) => {
+  const payment = await executePayment(req.body);
+  res.json(payment);
+});
diff --git a/migrations/20260917_ledger.sql b/migrations/20260917_ledger.sql
--- a/migrations/20260917_ledger.sql
+++ b/migrations/20260917_ledger.sql
@@ -1,2 +1,4 @@
+ALTER TABLE ledgers ADD CONSTRAINT balance_check CHECK (amount >= 0);
`;
const parsedDiff = ChangeDetectorService.parseDiff(sampleDiff);
assert.strictEqual(parsedDiff.filesChanged, 2);
assert.ok(parsedDiff.insertions >= 5);
assert.ok(parsedDiff.entities.some(e => e.type === 'api'));
assert.ok(parsedDiff.entities.some(e => e.type === 'schema'));
console.log(`✓ ChangeDetectorService verified: ${parsedDiff.entities.length} entities classified from unified diff (${parsedDiff.changeType})`);

// 6. Dynamic Test Recommender Engine
const recommended = TestRecommenderEngine.recommendTests(testGraph, impact);
assert.ok(recommended.recommendedTests.length > 0, 'Must produce recommended tests');
assert.ok(recommended.testMetrics.testReductionPercent > 0, 'Test suite reduction must be positive');
assert.ok(recommended.testMetrics.p0Count >= 1, 'Direct critical touched nodes must generate P0 priority tests');
console.log(`✓ TestRecommenderEngine verified: ${recommended.recommendedTests.length} tests recommended (${recommended.testMetrics.p0Count} P0, ${recommended.testMetrics.testReductionPercent}% suite reduction)`);

// 7. Research Model Baselines B1, B2, B3, B5 & Model Comparator
const ml = new ModelRiskPipeline();
const b1 = ml.runBaselineB1(impact);
const b2 = ml.runBaselineB2(impact);
const b3 = ml.runBaselineB3(impact, 45, 420, 1);
const b5 = ml.runProposedModelB5(impact, 800, true, 10);

assert.strictEqual(b1.architectureFamily, 'B1_STATIC');
assert.strictEqual(b2.architectureFamily, 'B2_RULE');
assert.strictEqual(b3.architectureFamily, 'B3_TRADITIONAL_ML');
assert.strictEqual(b5.architectureFamily, 'B5_TEMPORAL_GRAPH_ML');
assert.strictEqual(b5.isSimulatedPrototype, true, 'B5 must be transparently labeled as prototype simulation');
assert.ok(b3.calibratedProbability >= 0 && b3.calibratedProbability <= 1.0);
assert.ok(b5.calibratedProbability >= 0 && b5.calibratedProbability <= 1.0);

const comparison = ml.compareAllBaselines(impact);
assert.ok(comparison.b1_static && comparison.b2_rule && comparison.b3_traditional_ml && comparison.b5_temporal_gnn);
console.log(`✓ Model Risk Pipeline verified across all 4 baselines:
    - B1 (Static Reachability): Score ${b1.score}/100 (${b1.level})
    - B2 (Rule Criticality):   Score ${b2.score}/100 (${b2.level})
    - B3 (Tabular Logistic ML): Score ${b3.score}/100 (${b3.level}) [P=${b3.calibratedProbability}]
    - B5 (Proposed Temp GNN):  Score ${b5.score}/100 (${b5.level}) [P=${b5.calibratedProbability}]`);

// 8. Temporal Leakage Auditor Automated Suite
const auditSuite = TemporalLeakageAuditor.runAutomatedLeakageSuite();
for (const test of auditSuite) {
  assert.strictEqual(test.passed, true, `Audit suite test failed: ${test.testName}`);
}
console.log(`✓ Temporal Leakage Auditor P0 Suite passed: ${auditSuite.length}/${auditSuite.length} checks`);

// 9. Full-Stack End-to-End REST API Verification
import express from 'express';
import { createApiRouter } from '../src/server/api.ts';

async function testApiEndpoints() {
  const app = express();
  app.use(express.json());
  app.use('/api', createApiRouter());

  const server = app.listen(0);
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}/api`;

  try {
    // 9.1 Health checks
    const resHealth = await fetch(`${baseUrl}/health`).then(r => r.json());
    assert.strictEqual(resHealth.status, 'ok');

    const resSysHealth = await fetch(`${baseUrl}/system/health`).then(r => r.json());
    assert.strictEqual(resSysHealth.status, 'PASS');
    console.log('✓ GET /api/health and /api/system/health verified');

    // 9.2 Repositories & Commits
    const resRepos = await fetch(`${baseUrl}/repositories`).then(r => r.json());
    assert.strictEqual(Array.isArray(resRepos.repositories), true);
    assert.strictEqual(resRepos.repositories.length >= 4, true);

    const testRepoId = resRepos.repositories[0].id;
    const resSingleRepo = await fetch(`${baseUrl}/repositories/${testRepoId}`).then(r => r.json());
    assert.strictEqual(resSingleRepo.id, testRepoId);

    const resCommits = await fetch(`${baseUrl}/repositories/${testRepoId}/commits`).then(r => r.json());
    assert.strictEqual(Array.isArray(resCommits.commits), true);
    assert.strictEqual(resCommits.commits.length > 0, true);
    console.log('✓ GET /api/repositories and /api/repositories/:id/commits verified');

    // 9.3 Diff Parsing Endpoint
    const resDiff = await fetch(`${baseUrl}/diff/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ diffText: sampleDiff })
    }).then(r => r.json());
    assert.strictEqual(resDiff.filesChanged, 2);
    console.log('✓ POST /api/diff/parse verified');

    // 9.4 Compare Models Endpoint
    const analysisId = 'an-col-901';
    const resComp = await fetch(`${baseUrl}/analysis/${analysisId}/compare-models`).then(r => r.json());
    assert.ok(resComp.comparison.b1_static);
    assert.ok(resComp.comparison.b2_rule);
    assert.ok(resComp.comparison.b3_traditional_ml);
    assert.ok(resComp.comparison.b5_temporal_gnn);
    console.log('✓ GET /api/analysis/:id/compare-models verified');

    // 9.5 Granular Analysis Breakdown & Model Query Param
    const resRiskB3 = await fetch(`${baseUrl}/analysis/${analysisId}/risk?model=B3_TRADITIONAL_ML`).then(r => r.json());
    assert.strictEqual(resRiskB3.modelDetails.architectureFamily, 'B3_TRADITIONAL_ML');

    const resImpact = await fetch(`${baseUrl}/analysis/${analysisId}/impact`).then(r => r.json());
    assert.ok(Array.isArray(resImpact.affectedComponents));

    const resTests = await fetch(`${baseUrl}/analysis/${analysisId}/tests`).then(r => r.json());
    assert.ok(Array.isArray(resTests.recommendedTests));

    const resExpl = await fetch(`${baseUrl}/analysis/${analysisId}/explanation`).then(r => r.json());
    assert.ok(resExpl.explanation && resExpl.evidence);

    const resWhatIf = await fetch(`${baseUrl}/analysis/${analysisId}/what-if`).then(r => r.json());
    assert.ok(Array.isArray(resWhatIf.scenarios));

    console.log('✓ Granular analysis sub-endpoints (risk?model, impact, tests, explanation, what-if) verified');

    // 9.6 Human Release Decision & Post-T0 Outcome Persistence
    const resDec = await fetch(`${baseUrl}/analyses/${analysisId}/decisions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision: 'RELEASE_WITH_MITIGATION (Canary 10%)',
        rationale: 'E2E automated test decision validation',
        actor: 'qa.agent@system.test'
      })
    }).then(r => r.json());
    assert.strictEqual(resDec.status, 'SUCCESS');

    const resOutcome = await fetch(`${baseUrl}/analyses/${analysisId}/outcome`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deploymentStatus: 'SUCCESS',
        incidentOccurred: false,
        latencyDelta: '+0.1%'
      })
    }).then(r => r.json());
    assert.strictEqual(resOutcome.status, 'RECORDED');

    // 9.7 Experiments and Ablations
    const resExp = await fetch(`${baseUrl}/experiments`).then(r => r.json());
    assert.ok(Array.isArray(resExp.experiments));

    const resAbl = await fetch(`${baseUrl}/ablations`).then(r => r.json());
    assert.ok(Array.isArray(resAbl.ablations));
    console.log('✓ POST /api/analyses/:id/decisions, POST outcome, and GET experiments/ablations verified');

  } finally {
    server.close();
  }
}

testApiEndpoints().then(() => {
  console.log('====================================================');
  console.log('--- ALL TEST SUITE ASSERTIONS PASSED WITH ZERO ERRORS ---');
  console.log('====================================================');
}).catch((err) => {
  console.error('Test suite failure:', err);
  process.exit(1);
});
