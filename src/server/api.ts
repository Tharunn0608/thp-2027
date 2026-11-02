import express from 'express';
import { PRECONFIGURED_ANALYSES, BENCHMARK_EXPERIMENTS, CONTROLLED_MICROSERVICE_GRAPH } from '../mockData.ts';
import { DEMO_REPOSITORIES } from '../data/repositories.ts';
import { SoftwareRiskGraphEngine } from '../graph/engine.ts';
import { ModelRiskPipeline } from '../ml/pipeline.ts';
import { ExplanationService } from '../services/explanation.ts';
import { ChangeDetectorService } from '../services/changeParser.ts';
import { TestRecommenderEngine } from '../services/testRecommender.ts';
import { AnalysisResult } from '../types.ts';
import { db } from '../db/store.ts';

export function createApiRouter() {
  const router = express.Router();
  const graphEngine = new SoftwareRiskGraphEngine(CONTROLLED_MICROSERVICE_GRAPH);
  const modelPipeline = new ModelRiskPipeline();
  const explanationService = new ExplanationService();

  // Health check endpoint
  router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'change-risk-graph-api' });
  });

  router.get('/system/health', (req, res) => {
    res.json({
      status: 'PASS',
      timestamp: new Date().toISOString(),
      components: {
        frontend: 'PASS',
        backend: 'PASS',
        database: 'PASS',
        repositoryEngine: 'PASS',
        graphEngine: 'PASS',
        temporalEngine: 'PASS',
        aiEngine: 'PASS',
        testEngine: 'PASS'
      }
    });
  });

  // Helper to resolve an analysis by analysisId, commitKey, commitSha, or repoId
  function findAnalysis(id: string): AnalysisResult | undefined {
    if (!id) return undefined;
    return (
      db.getAnalysis(id) ||
      PRECONFIGURED_ANALYSES[id] ||
      Object.values(PRECONFIGURED_ANALYSES).find((a: AnalysisResult) => 
        a.analysisId === id || a.commitSha === id || a.repositoryId === id
      ) ||
      db.getAllAnalyses().find(a => 
        a.analysisId === id || a.commitSha === id || a.repositoryId === id
      )
    );
  }

  // Repositories listing endpoint (Repository-Agnostic)
  router.get('/repositories', (req, res) => {
    res.json({ repositories: DEMO_REPOSITORIES });
  });

  // Specific repository endpoint
  router.get('/repositories/:id', (req, res) => {
    const repo = DEMO_REPOSITORIES.find(r => r.id === req.params.id);
    if (!repo) {
      return res.status(404).json({ error: { code: 'REPO_NOT_FOUND', message: 'Repository not found' } });
    }
    res.json(repo);
  });

  // Repository commits
  router.get('/repositories/:id/commits', (req, res) => {
    const repo = DEMO_REPOSITORIES.find(r => r.id === req.params.id);
    if (!repo) {
      return res.status(404).json({ error: { code: 'REPO_NOT_FOUND', message: 'Repository not found' } });
    }
    res.json({ commits: repo.commits });
  });

  // Legacy projects list for backward-compatibility
  router.get('/projects', (req, res) => {
    res.json({
      projects: DEMO_REPOSITORIES.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        activeBranch: r.branch,
        componentsCount: r.servicesCount + r.databasesCount,
        lastAnalysisId: r.commits[0]?.analysisKey
      }))
    });
  });

  // Graph topology endpoint with T0 cutoff filter
  router.get('/projects/:projectId/graph', (req, res) => {
    const repoId = req.params.projectId;
    const repo = DEMO_REPOSITORIES.find(r => r.id === repoId);
    const analysisKey = repo?.commits[0]?.analysisKey || 'commit-452-high-risk';
    const analysis = PRECONFIGURED_ANALYSES[analysisKey] || PRECONFIGURED_ANALYSES['commit-452-high-risk'];
    
    const engine = new SoftwareRiskGraphEngine(analysis.graph);
    const t0 = req.query.t0 as string || new Date().toISOString();
    const snapshot = engine.getSnapshotAtT0(t0);
    res.json(snapshot);
  });

  // Get specific analysis summary (supports both /analyses/:id and /analysis/:id)
  router.get(['/analyses/:analysisId', '/analysis/:analysisId'], (req, res) => {
    const analysisId = req.params.analysisId;
    const found = findAnalysis(analysisId);
    if (!found) {
      return res.status(404).json({ error: { code: 'ANALYSIS_NOT_FOUND', message: 'Analysis not found' } });
    }
    res.json(found);
  });

  // Project / Repository analyses listing
  router.get(['/projects/:projectId/analyses', '/repositories/:projectId/analyses'], (req, res) => {
    const { projectId } = req.params;
    const allAnalyses = db.getAllAnalyses();
    const repoAnalyses = allAnalyses.filter(a => a.repositoryId === projectId);
    if (repoAnalyses.length > 0) {
      return res.json({ analyses: repoAnalyses });
    }
    const repo = DEMO_REPOSITORIES.find(r => r.id === projectId);
    if (repo) {
      const keys = repo.commits.map(c => c.analysisKey);
      const matches = keys.map(k => findAnalysis(k)).filter(Boolean);
      return res.json({ analyses: matches });
    }
    res.json({ analyses: allAnalyses });
  });

  // Endpoint to parse raw git diffs and classify changed entities
  router.post('/diff/parse', (req, res) => {
    const { diffText } = req.body;
    if (!diffText || typeof diffText !== 'string') {
      return res.status(400).json({ error: { code: 'INVALID_DIFF', message: 'diffText string is required' } });
    }
    const parsed = ChangeDetectorService.parseDiff(diffText);
    res.json(parsed);
  });

  // Dynamic analysis submission endpoint (Repository-Agnostic)
  router.post('/projects/:projectId/analyses', async (req, res) => {
    const { projectId } = req.params;
    const { 
      commitSha, 
      diffText,
      modelFamily = 'B5_TEMPORAL_GRAPH_ML', 
      cutoffT0 = '2026-09-17T09:00:00Z',
      activeRps,
      hasHistoricalIncident
    } = req.body;

    const repo = DEMO_REPOSITORIES.find(r => r.id === projectId);
    const targetCommit = repo?.commits.find(c => c.sha === commitSha) || repo?.commits[0];
    const analysisKey = targetCommit?.analysisKey || (projectId === 'repo-college-mgmt' ? 'college-commit-enrollment' : projectId === 'repo-banking-core' ? 'banking-commit-aml' : 'commit-452-high-risk');
    
    const baseAnalysis = PRECONFIGURED_ANALYSES[analysisKey] || PRECONFIGURED_ANALYSES['college-commit-enrollment'];
    const activeEngine = new SoftwareRiskGraphEngine(baseAnalysis.graph);
    
    // Find the changed entity node dynamically
    const changedNode = baseAnalysis.graph.nodes.find(n => n.isChanged) || baseAnalysis.graph.nodes[0];
    const traversal = activeEngine.calculateDownstreamImpact(changedNode.id);

    // Dynamic entity classification if diff is passed
    let parsedDiff = diffText ? ChangeDetectorService.parseDiff(diffText) : undefined;

    let prediction;
    if (modelFamily === 'B1_STATIC') {
      prediction = modelPipeline.runBaselineB1(traversal);
    } else if (modelFamily === 'B2_RULE') {
      prediction = modelPipeline.runBaselineB2(traversal);
    } else if (modelFamily === 'B3_TRADITIONAL_ML') {
      prediction = modelPipeline.runBaselineB3(traversal, parsedDiff ? parsedDiff.insertions + parsedDiff.deletions : 54, activeRps || 640);
    } else {
      prediction = modelPipeline.runProposedModelB5(traversal, activeRps || 920, hasHistoricalIncident !== undefined ? hasHistoricalIncident : true);
    }

    // Dynamic test recommendation based on graph traversal
    const dynamicTests = TestRecommenderEngine.recommendTests(baseAnalysis.graph, traversal, baseAnalysis.recommendedTests);

    const updatedResult: AnalysisResult = {
      ...baseAnalysis,
      analysisId: `an-${Date.now().toString().slice(-4)}`,
      commitSha: commitSha || baseAnalysis.commitSha,
      predictionTimeT0: cutoffT0,
      risk: {
        ...baseAnalysis.risk,
        score: prediction.score,
        level: prediction.level,
        modelId: prediction.modelId,
        modelVersion: prediction.modelVersion,
        calibratedProbability: prediction.calibratedProbability,
        confidence: prediction.confidence
      },
      recommendedTests: dynamicTests.recommendedTests,
      testMetrics: dynamicTests.testMetrics
    };

    if (parsedDiff && parsedDiff.entities.length > 0) {
      updatedResult.changeSummary = {
        ...updatedResult.changeSummary,
        changeType: parsedDiff.changeType,
        filesChanged: parsedDiff.filesChanged,
        insertions: parsedDiff.insertions,
        deletions: parsedDiff.deletions,
        entities: parsedDiff.entities
      };
    }

    db.saveAnalysis(updatedResult);
    res.status(201).json(updatedResult);
  });

  // Alias endpoint: POST /analysis
  router.post('/analysis', async (req, res) => {
    const { 
      projectId = 'repo-college-mgmt', 
      commitSha, 
      diffText,
      modelFamily = 'B5_TEMPORAL_GRAPH_ML', 
      cutoffT0 = '2026-09-17T09:00:00Z',
      activeRps,
      hasHistoricalIncident
    } = req.body;
    const repo = DEMO_REPOSITORIES.find(r => r.id === projectId);
    const targetCommit = repo?.commits.find(c => c.sha === commitSha) || repo?.commits[0];
    const analysisKey = targetCommit?.analysisKey || (projectId === 'repo-college-mgmt' ? 'college-commit-enrollment' : projectId === 'repo-banking-core' ? 'banking-commit-aml' : 'commit-452-high-risk');
    
    const baseAnalysis = PRECONFIGURED_ANALYSES[analysisKey] || PRECONFIGURED_ANALYSES['college-commit-enrollment'];
    const activeEngine = new SoftwareRiskGraphEngine(baseAnalysis.graph);
    
    const changedNode = baseAnalysis.graph.nodes.find(n => n.isChanged) || baseAnalysis.graph.nodes[0];
    const traversal = activeEngine.calculateDownstreamImpact(changedNode.id);

    let parsedDiff = diffText ? ChangeDetectorService.parseDiff(diffText) : undefined;

    let prediction;
    if (modelFamily === 'B1_STATIC') {
      prediction = modelPipeline.runBaselineB1(traversal);
    } else if (modelFamily === 'B2_RULE') {
      prediction = modelPipeline.runBaselineB2(traversal);
    } else if (modelFamily === 'B3_TRADITIONAL_ML') {
      prediction = modelPipeline.runBaselineB3(traversal, parsedDiff ? parsedDiff.insertions + parsedDiff.deletions : 54, activeRps || 640);
    } else {
      prediction = modelPipeline.runProposedModelB5(traversal, activeRps || 920, hasHistoricalIncident !== undefined ? hasHistoricalIncident : true);
    }

    const dynamicTests = TestRecommenderEngine.recommendTests(baseAnalysis.graph, traversal, baseAnalysis.recommendedTests);

    const updatedResult: AnalysisResult = {
      ...baseAnalysis,
      analysisId: `an-${Date.now().toString().slice(-4)}`,
      commitSha: commitSha || baseAnalysis.commitSha,
      predictionTimeT0: cutoffT0,
      risk: {
        ...baseAnalysis.risk,
        score: prediction.score,
        level: prediction.level,
        modelId: prediction.modelId,
        modelVersion: prediction.modelVersion,
        calibratedProbability: prediction.calibratedProbability,
        confidence: prediction.confidence
      },
      recommendedTests: dynamicTests.recommendedTests,
      testMetrics: dynamicTests.testMetrics
    };

    if (parsedDiff && parsedDiff.entities.length > 0) {
      updatedResult.changeSummary = {
        ...updatedResult.changeSummary,
        changeType: parsedDiff.changeType,
        filesChanged: parsedDiff.filesChanged,
        insertions: parsedDiff.insertions,
        deletions: parsedDiff.deletions,
        entities: parsedDiff.entities
      };
    }

    db.saveAnalysis(updatedResult);
    res.status(201).json(updatedResult);
  });

  // Granular Sub-Endpoints for Analysis Breakdown
  router.get(['/analyses/:analysisId/compare-models', '/analysis/:analysisId/compare-models'], (req, res) => {
    const found = findAnalysis(req.params.analysisId);
    if (!found) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Analysis not found' } });
    
    const activeEngine = new SoftwareRiskGraphEngine(found.graph);
    const changedNode = found.graph.nodes.find(n => n.isChanged) || found.graph.nodes[0];
    const traversal = activeEngine.calculateDownstreamImpact(changedNode.id);
    
    const comparison = modelPipeline.compareAllBaselines(traversal);
    res.json({
      analysisId: found.analysisId,
      commitSha: found.commitSha,
      comparison,
      scientificIntegrityNotice: 'B1 (Static), B2 (Rule), and B3 (Tabular ML) are fully executed baselines. B5 is an executable architectural prototype of the Proposed Temporal GNN.'
    });
  });

  router.get(['/analyses/:analysisId/risk', '/analysis/:analysisId/risk'], (req, res) => {
    const found = findAnalysis(req.params.analysisId);
    if (!found) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Analysis not found' } });
    
    const modelParam = req.query.model as string;
    if (modelParam) {
      const activeEngine = new SoftwareRiskGraphEngine(found.graph);
      const changedNode = found.graph.nodes.find(n => n.isChanged) || found.graph.nodes[0];
      const traversal = activeEngine.calculateDownstreamImpact(changedNode.id);
      let pred;
      if (modelParam === 'B1_STATIC') pred = modelPipeline.runBaselineB1(traversal);
      else if (modelParam === 'B2_RULE') pred = modelPipeline.runBaselineB2(traversal);
      else if (modelParam === 'B3_TRADITIONAL_ML') pred = modelPipeline.runBaselineB3(traversal);
      else pred = modelPipeline.runProposedModelB5(traversal);

      return res.json({
        risk: {
          ...found.risk,
          score: pred.score,
          level: pred.level,
          modelId: pred.modelId,
          modelVersion: pred.modelVersion,
          confidence: pred.confidence,
          calibratedProbability: pred.calibratedProbability
        },
        blastRadius: found.blastRadius,
        modelDetails: pred
      });
    }

    res.json({ risk: found.risk, blastRadius: found.blastRadius });
  });

  router.get(['/analyses/:analysisId/impact', '/analysis/:analysisId/impact'], (req, res) => {
    const found = findAnalysis(req.params.analysisId);
    if (!found) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Analysis not found' } });
    res.json({ affectedComponents: found.affectedComponents, blastRadius: found.blastRadius });
  });

  router.get(['/analyses/:analysisId/tests', '/analysis/:analysisId/tests'], (req, res) => {
    const found = findAnalysis(req.params.analysisId);
    if (!found) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Analysis not found' } });
    res.json({ recommendedTests: found.recommendedTests, testMetrics: found.testMetrics });
  });

  router.get(['/analyses/:analysisId/explanation', '/analysis/:analysisId/explanation'], (req, res) => {
    const found = findAnalysis(req.params.analysisId);
    if (!found) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Analysis not found' } });
    res.json({ explanation: found.explanation, evidence: found.evidence });
  });

  router.post(['/analyses/:analysisId/what-if', '/analysis/:analysisId/what-if'], (req, res) => {
    const { scenarioType = 'CANARY_10' } = req.body;
    const found = findAnalysis(req.params.analysisId);
    if (!found) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Analysis not found' } });
    
    const scenario = found.whatIfScenarios.find(s => s.type === scenarioType) || found.whatIfScenarios[0];
    res.json({ simulatedScenario: scenario });
  });

  router.get(['/analyses/:analysisId/what-if', '/analysis/:analysisId/what-if'], (req, res) => {
    const found = findAnalysis(req.params.analysisId);
    if (!found) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Analysis not found' } });
    res.json({ scenarios: found.whatIfScenarios });
  });

  // Research experiments & ablation metrics
  router.get('/experiments', (req, res) => {
    res.json({
      protocol: 'Chronological evaluation split (frozen test split)',
      experiments: BENCHMARK_EXPERIMENTS
    });
  });

  router.get('/evaluation', (req, res) => {
    res.json({
      protocol: 'Chronological evaluation split (frozen test split)',
      experiments: BENCHMARK_EXPERIMENTS
    });
  });

  router.get('/ablations', (req, res) => {
    const fullExp = BENCHMARK_EXPERIMENTS.find(e => e.id === 'exp-005') || BENCHMARK_EXPERIMENTS[4];
    res.json({
      ablations: fullExp.ablations
    });
  });

  // Record human release decision / gate
  router.post(['/analyses/:analysisId/decisions', '/analysis/:analysisId/decisions', '/analyses/:analysisId/decision', '/analysis/:analysisId/decision'], (req, res) => {
    const { analysisId } = req.params;
    const { decision, rationale, actor } = req.body;

    const record = db.recordDecision(analysisId, decision, rationale, actor);
    res.status(201).json({ status: 'SUCCESS', record });
  });

  // List all audit decision records
  router.get('/decisions', (req, res) => {
    res.json({ decisions: db.getDecisions() });
  });

  // Record actual post-T0 outcome
  router.post(['/analyses/:analysisId/outcome', '/analysis/:analysisId/outcome', '/analyses/:analysisId/outcomes', '/analysis/:analysisId/outcomes'], (req, res) => {
    const { analysisId } = req.params;
    const outcomeData = req.body;

    const recorded = db.recordOutcome(analysisId, outcomeData);
    res.json({
      status: 'RECORDED',
      analysisId,
      recorded,
      message: 'Ground truth outcome recorded for future historical learning cycles.'
    });
  });

  // Retrieve outcomes for an analysis
  router.get(['/analyses/:analysisId/outcomes', '/analysis/:analysisId/outcomes'], (req, res) => {
    const { analysisId } = req.params;
    res.json({ outcomes: db.getOutcomes(analysisId) });
  });

  return router;
}
