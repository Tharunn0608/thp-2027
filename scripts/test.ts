import assert from 'node:assert';
import { db } from '../src/db/store.ts';
import { DEMO_REPOSITORIES } from '../src/data/repositories.ts';
import { PRECONFIGURED_ANALYSES } from '../src/mockData.ts';
import { SoftwareRiskGraphEngine } from '../src/graph/engine.ts';
import { ModelRiskPipeline } from '../src/ml/pipeline.ts';

console.log('--- RUNNING AUTOMATED AUDIT SUITE ---');

// 1. Check all repositories
assert.strictEqual(DEMO_REPOSITORIES.length >= 3, true);
console.log('✓ Repositories count check passed:', DEMO_REPOSITORIES.length);

// 2. Check each repository has distinct analysis
for (const repo of DEMO_REPOSITORIES) {
  const commit = repo.commits[0];
  assert.ok(commit, `Repo ${repo.id} must have at least one commit`);
  const analysis = PRECONFIGURED_ANALYSES[commit.analysisKey];
  assert.ok(analysis, `Analysis ${commit.analysisKey} must exist for repo ${repo.id}`);
  assert.ok(analysis.graph.nodes.length > 0, `Graph nodes must exist for ${repo.id}`);
  assert.ok(analysis.recommendedTests.length > 0, `Tests must be recommended for ${repo.id}`);
  console.log(`✓ Repository '${repo.name}' verified: ${analysis.graph.nodes.length} nodes, Risk ${analysis.risk.score}/100 (${analysis.risk.level})`);
}

// 3. Bidirectional graph traversal test
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

// 5. ML Pipeline Reproducibility
const ml = new ModelRiskPipeline();
const p1 = ml.runProposedModelB5(impact, 800, true, 10);
const p2 = ml.runProposedModelB5(impact, 800, true, 10);
assert.strictEqual(p1.score, p2.score, 'Outputs must be deterministic');
console.log('✓ Model pipeline reproducibility verified: Score =', p1.score);

// 6. Temporal Leakage Auditor Automated Suite
import { TemporalLeakageAuditor } from '../src/graph/temporal_auditor.ts';
const auditSuite = TemporalLeakageAuditor.runAutomatedLeakageSuite();
for (const test of auditSuite) {
  assert.strictEqual(test.passed, true, `Audit suite test failed: ${test.testName}`);
}
console.log(`✓ Temporal Leakage Auditor P0 Suite passed: ${auditSuite.length}/${auditSuite.length} tests`);

// 7. Full-Stack End-to-End REST API Verification
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
    // 7.1 Health checks
    const resHealth = await fetch(`${baseUrl}/health`).then(r => r.json());
    assert.strictEqual(resHealth.status, 'ok');

    const resSysHealth = await fetch(`${baseUrl}/system/health`).then(r => r.json());
    assert.strictEqual(resSysHealth.status, 'PASS');
    console.log('✓ GET /api/health and /api/system/health verified');

    // 7.2 Repositories
    const resRepos = await fetch(`${baseUrl}/repositories`).then(r => r.json());
    assert.strictEqual(Array.isArray(resRepos.repositories), true);
    assert.strictEqual(resRepos.repositories.length >= 3, true);

    const testRepoId = resRepos.repositories[0].id;
    const resSingleRepo = await fetch(`${baseUrl}/repositories/${testRepoId}`).then(r => r.json());
    assert.strictEqual(resSingleRepo.id, testRepoId);

    const resCommits = await fetch(`${baseUrl}/repositories/${testRepoId}/commits`).then(r => r.json());
    assert.strictEqual(Array.isArray(resCommits.commits), true);
    assert.strictEqual(resCommits.commits.length > 0, true);
    console.log('✓ GET /api/repositories and /api/repositories/:id/commits verified');

    // 7.3 Projects/Analyses
    const resProjAnalyses = await fetch(`${baseUrl}/projects/${testRepoId}/analyses`).then(r => r.json());
    assert.strictEqual(Array.isArray(resProjAnalyses.analyses), true);
    assert.strictEqual(resProjAnalyses.analyses.length > 0, true);
    console.log('✓ GET /api/projects/:id/analyses verified');

    // 7.4 Sub-Endpoints for Analysis Breakdown
    const analysisId = 'an-col-901';
    const resRisk = await fetch(`${baseUrl}/analysis/${analysisId}/risk`).then(r => r.json());
    assert.ok(resRisk.risk.score >= 0 && resRisk.risk.score <= 100);

    const resImpact = await fetch(`${baseUrl}/analysis/${analysisId}/impact`).then(r => r.json());
    assert.ok(Array.isArray(resImpact.affectedComponents));

    const resTests = await fetch(`${baseUrl}/analysis/${analysisId}/tests`).then(r => r.json());
    assert.ok(Array.isArray(resTests.recommendedTests));

    const resExpl = await fetch(`${baseUrl}/analysis/${analysisId}/explanation`).then(r => r.json());
    assert.ok(resExpl.explanation && resExpl.evidence);

    const resWhatIf = await fetch(`${baseUrl}/analysis/${analysisId}/what-if`).then(r => r.json());
    assert.ok(Array.isArray(resWhatIf.scenarios));

    console.log('✓ Granular analysis sub-endpoints (risk, impact, tests, explanation, what-if) verified');

    // 7.5 Post Decisions & Outcomes
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

    // 7.6 Experiments and Ablations
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
  console.log('--- ALL TEST SUITE ASSERTIONS PASSED ---');
}).catch((err) => {
  console.error('Test suite failure:', err);
  process.exit(1);
});
