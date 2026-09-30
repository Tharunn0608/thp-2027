import React, { useState } from 'react';
import { 
  Network, 
  GitCommit, 
  CheckSquare, 
  Sliders, 
  FlaskConical, 
  History, 
  ShieldCheck, 
  FolderGit2,
  Terminal,
  Activity,
  Layers,
  Zap,
  Play,
  ArrowRight,
  GitBranch,
  RefreshCw,
  Download,
  Flame,
  Sparkles,
  LayoutDashboard,
  FileCode,
  Lock,
  Compass,
  Cpu,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';
import { PRECONFIGURED_ANALYSES } from '../../mockData.ts';
import { DEMO_REPOSITORIES } from '../../data/repositories.ts';
import { RepositorySummary } from '../../types/repository.ts';
import { AnalysisResult, GraphNode } from '../../types.ts';
import { ChangeSummaryPanel } from '../workspace/ChangeSummaryPanel.tsx';
import { GraphCanvas } from '../workspace/GraphCanvas.tsx';
import { RiskEvidencePanel } from '../workspace/RiskEvidencePanel.tsx';
import { BottomEvidenceDeck } from '../workspace/BottomEvidenceDeck.tsx';
import { TestRecommendationTable } from '../workspace/TestRecommendationTable.tsx';
import { WhatIfReleaseView } from '../workspace/WhatIfReleaseView.tsx';
import { ResearchEvaluationView } from '../workspace/ResearchEvaluationView.tsx';
import { HistoryFeedbackView } from '../workspace/HistoryFeedbackView.tsx';
import { SecurityAuditView } from '../workspace/SecurityAuditView.tsx';
import { RepositoryExplorerView } from '../workspace/RepositoryExplorerView.tsx';
import { ImportRepositoryModal } from '../workspace/ImportRepositoryModal.tsx';

type NavigationTab = 
  | 'DASHBOARD'
  | 'REPOSITORIES'
  | 'CHANGE_ANALYSIS'
  | 'GRAPH_EXPLORER'
  | 'RISK_IMPACT'
  | 'TESTS'
  | 'EXPLANATION'
  | 'WHAT_IF'
  | 'RELEASE_DECISION'
  | 'HISTORY'
  | 'RESEARCH'
  | 'SECURITY';

export const MainAppShell: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('DASHBOARD');
  const [selectedRepo, setSelectedRepo] = useState<RepositorySummary>(DEMO_REPOSITORIES[0]); // Default: College Management
  const [selectedCommitKey, setSelectedCommitKey] = useState<string>('college-commit-enrollment');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Dynamic analysis based on selected commit / repository
  const currentAnalysis: AnalysisResult = PRECONFIGURED_ANALYSES[selectedCommitKey] || PRECONFIGURED_ANALYSES['college-commit-enrollment'];

  const handleSelectRepository = (repo: RepositorySummary) => {
    setSelectedRepo(repo);
    const firstCommit = repo.commits[0];
    if (firstCommit && PRECONFIGURED_ANALYSES[firstCommit.analysisKey]) {
      setSelectedCommitKey(firstCommit.analysisKey);
    }
  };

  const triggerAnalyzeFlow = async (options?: { targetRepo?: RepositorySummary; targetKey?: string }) => {
    const targetRepo = options?.targetRepo || selectedRepo;
    const targetKey = options?.targetKey || selectedCommitKey;
    setIsAnalyzing(true);
    if (activeTab !== 'DASHBOARD' && activeTab !== 'GRAPH_EXPLORER' && activeTab !== 'CHANGE_ANALYSIS' && activeTab !== 'RISK_IMPACT') {
      setActiveTab('DASHBOARD');
    }
    const targetAnalysis = PRECONFIGURED_ANALYSES[targetKey] || currentAnalysis;
    try {
      await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: targetRepo.id,
          commitSha: targetAnalysis.commitSha,
          modelFamily: 'B5_TEMPORAL_GRAPH_ML',
          cutoffT0: targetAnalysis.predictionTimeT0
        })
      });
    } catch (e) {
      console.warn('API sync warning:', e);
    }
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 600);
  };

  const handleSelectCommitAndAnalyze = (repo: RepositorySummary, commitSha: string) => {
    setSelectedRepo(repo);
    const commit = repo.commits.find(c => c.sha === commitSha) || repo.commits[0];
    const key = commit && PRECONFIGURED_ANALYSES[commit.analysisKey] ? commit.analysisKey : 'college-commit-enrollment';
    setSelectedCommitKey(key);
    triggerAnalyzeFlow({ targetRepo: repo, targetKey: key });
  };

  const handleSelectAnalysisKey = (key: string) => {
    setSelectedCommitKey(key);
    const owningRepo = DEMO_REPOSITORIES.find(r => r.commits.some(c => c.analysisKey === key));
    if (owningRepo) {
      setSelectedRepo(owningRepo);
    }
    setActiveTab('DASHBOARD');
  };

  const handleRecordDecision = async (status: any, rationale: string) => {
    console.log(`[DECISION_LOG] Status: ${status}, Rationale: ${rationale}`);
    try {
      await fetch(`/api/analyses/${currentAnalysis.analysisId}/decisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: status,
          rationale,
          actor: 'release.engineer@org.internal'
        })
      });
    } catch (e) {
      console.warn('Failed to persist decision to API:', e);
    }
  };

  const handleNewRepoImported = (newRepo: RepositorySummary) => {
    DEMO_REPOSITORIES.unshift(newRepo);
    handleSelectRepository(newRepo);
    setActiveTab('DASHBOARD');
  };

  const navigateTo = (tab: NavigationTab) => {
    setActiveTab(tab);
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="flex h-screen w-screen bg-[#030712] text-slate-100 font-sans overflow-hidden antialiased">
      {/* Mobile Drawer Backdrop */}
      {isMobileSidebarOpen && (
        <div 
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      {/* 1. Left Navigation Rail (Neural Glass Command Sidebar) */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 border-r border-slate-800/80 bg-slate-950/95 lg:bg-slate-950/70 backdrop-blur-xl
        flex flex-col justify-between shrink-0 select-none transition-transform duration-300
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand Logo & Title */}
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-[0_0_16px_rgba(99,102,241,0.5)] border border-indigo-400/30 shrink-0">
                <Network className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xs font-extrabold text-slate-100 tracking-wider uppercase font-mono truncate">
                  AI Change-Risk Graph
                </h1>
                <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  NEURAL GLASS · v2.1
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
              title="Close Sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Context & Repository Picker */}
          <div className="p-3 border-b border-slate-800/80 bg-slate-950/40 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Target Repository
              </label>
              <button 
                onClick={() => navigateTo('REPOSITORIES')}
                className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Browse ({DEMO_REPOSITORIES.length})
              </button>
            </div>

            <div className="relative">
              <select
                value={selectedRepo.id}
                onChange={(e) => {
                  const found = DEMO_REPOSITORIES.find(r => r.id === e.target.value);
                  if (found) handleSelectRepository(found);
                }}
                className="w-full bg-slate-900/90 border border-slate-700/80 text-xs text-slate-200 rounded-xl p-2 pr-8 focus:outline-hidden focus:border-indigo-500 font-sans truncate appearance-none cursor-pointer"
              >
                {DEMO_REPOSITORIES.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>

            {/* Commit Selector for Active Repo */}
            <div className="flex items-center justify-between pt-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Active Change Commit
              </label>
            </div>

            <div className="relative">
              <select
                value={selectedCommitKey}
                onChange={(e) => setSelectedCommitKey(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700/80 text-xs text-slate-200 rounded-xl p-2 pr-8 focus:outline-hidden focus:border-indigo-500 font-mono truncate appearance-none cursor-pointer"
              >
                {selectedRepo.commits.map(c => (
                  <option key={c.sha} value={c.analysisKey}>
                    {c.sha.substring(0, 7)}: {c.message.substring(0, 22)}...
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>

            {/* Execute Analysis Action Button */}
            <button
              onClick={() => triggerAnalyzeFlow()}
              disabled={isAnalyzing}
              className="w-full py-2 px-3 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 active:opacity-90 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-[0_4px_16px_rgba(99,102,241,0.3)] mt-1"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Traversing Graph...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Analyze Change</span>
                </>
              )}
            </button>
          </div>

          {/* Navigation Links Scrollable List */}
          <nav className="p-2 space-y-1 text-xs overflow-y-auto flex-1 font-medium">
            {/* 1. Dashboard */}
            <button
              onClick={() => navigateTo('DASHBOARD')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                activeTab === 'DASHBOARD'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold shadow-[0_2px_10px_rgba(99,102,241,0.35)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            {/* 2. Repositories */}
            <button
              onClick={() => navigateTo('REPOSITORIES')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                activeTab === 'REPOSITORIES'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold shadow-[0_2px_10px_rgba(99,102,241,0.35)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <FolderGit2 className="w-4 h-4" />
              <span>Repositories</span>
            </button>

            {/* 3. Change Analysis */}
            <button
              onClick={() => navigateTo('CHANGE_ANALYSIS')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                activeTab === 'CHANGE_ANALYSIS'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold shadow-[0_2px_10px_rgba(99,102,241,0.35)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>Change Analysis</span>
            </button>

            {/* 4. Graph Explorer */}
            <button
              onClick={() => navigateTo('GRAPH_EXPLORER')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                activeTab === 'GRAPH_EXPLORER'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold shadow-[0_2px_10px_rgba(99,102,241,0.35)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Graph Explorer</span>
            </button>

            {/* 5. Risk & Impact */}
            <button
              onClick={() => navigateTo('RISK_IMPACT')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                activeTab === 'RISK_IMPACT'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold shadow-[0_2px_10px_rgba(99,102,241,0.35)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Risk & Impact</span>
            </button>

            {/* 6. Test Scope */}
            <button
              onClick={() => navigateTo('TESTS')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                activeTab === 'TESTS'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold shadow-[0_2px_10px_rgba(99,102,241,0.35)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>Test Scope</span>
            </button>

            {/* 7. Explanation */}
            <button
              onClick={() => navigateTo('EXPLANATION')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                activeTab === 'EXPLANATION'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold shadow-[0_2px_10px_rgba(99,102,241,0.35)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Explanation</span>
            </button>

            {/* 8. What-If */}
            <button
              onClick={() => navigateTo('WHAT_IF')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                activeTab === 'WHAT_IF'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold shadow-[0_2px_10px_rgba(99,102,241,0.35)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>What-If</span>
            </button>

            {/* 9. Release Decision */}
            <button
              onClick={() => navigateTo('RELEASE_DECISION')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                activeTab === 'RELEASE_DECISION'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold shadow-[0_2px_10px_rgba(99,102,241,0.35)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Release Decision</span>
            </button>

            {/* 10. Historical Outcomes */}
            <button
              onClick={() => navigateTo('HISTORY')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                activeTab === 'HISTORY'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold shadow-[0_2px_10px_rgba(99,102,241,0.35)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Historical Outcomes</span>
            </button>

            {/* 11. Research Evaluation */}
            <button
              onClick={() => navigateTo('RESEARCH')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                activeTab === 'RESEARCH'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold shadow-[0_2px_10px_rgba(99,102,241,0.35)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              <span>Research Evaluation</span>
            </button>

            {/* 12. Security & Leakage Gate */}
            <button
              onClick={() => navigateTo('SECURITY')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                activeTab === 'SECURITY'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold shadow-[0_2px_10px_rgba(99,102,241,0.35)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Security & Leakage Gate</span>
            </button>
          </nav>
        </div>

        {/* Footer info & ZIP Download */}
        <div className="p-3 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono space-y-2.5 bg-slate-950/60">
          <a
            href="/ai-change-risk-graph-capstone.zip"
            download="ai-change-risk-graph-capstone.zip"
            className="w-full flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-gradient-to-r from-indigo-600/90 to-cyan-600/90 hover:from-indigo-600 hover:to-cyan-600 text-white font-sans text-xs font-semibold shadow-[0_2px_10px_rgba(99,102,241,0.3)] transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Project ZIP</span>
          </a>

          <div className="flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span>T₀ Barrier Active</span>
            </div>
            <span className="text-slate-500">Agnostic ML</span>
          </div>
        </div>
      </aside>

      {/* 2. Main Content Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">
        {/* Top Command Center Header Bar */}
        <header className="h-14 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between z-20 shrink-0 gap-3 min-w-0">
          {/* Top Left: Hamburger + Breadcrumb / Active Context */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-900 rounded-lg transition-colors shrink-0"
              title="Open Navigation"
            >
              <Menu className="w-4 h-4" />
            </button>

            <span className="text-xs font-mono bg-indigo-950/80 text-indigo-300 px-2.5 sm:px-3 py-1.5 rounded-xl border border-indigo-800/70 font-bold flex items-center gap-1.5 shadow-xs truncate max-w-[170px] sm:max-w-[260px]">
              <FolderGit2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="truncate">{selectedRepo.name}</span>
            </span>

            <span className="text-xs text-slate-400 hidden sm:flex items-center gap-1 font-mono shrink-0">
              <GitBranch className="w-3.5 h-3.5 text-slate-500" />
              <strong className="text-slate-200">{selectedRepo.branch}</strong>
            </span>

            <span className="text-xs text-slate-400 hidden xl:inline font-mono truncate">
              Category: <span className="text-cyan-400">{selectedRepo.category}</span>
            </span>
          </div>

          {/* Top Right: Commit, System Status & Engineer Identity */}
          <div className="flex items-center gap-2 sm:gap-4 text-xs font-mono shrink-0">
            {/* System Status Indicators */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)] animate-pulse" />
              <span className="text-slate-300 font-semibold">T₀ Chronological Firewall</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-300 bg-slate-900/90 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-800">
              <Terminal className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Commit: <strong className="text-slate-100">{currentAnalysis.commitSha.substring(0, 7)}</strong></span>
            </div>

            <div className="flex items-center gap-2 pl-2 border-l border-slate-800 shrink-0">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-700 to-cyan-600 border border-indigo-400/40 flex items-center justify-center text-xs font-bold text-white shadow-xs">
                RE
              </div>
              <span className="text-slate-200 text-xs hidden sm:inline font-sans font-medium">Release Engineer</span>
            </div>
          </div>
        </header>

        {/* Dynamic Main Stage Container */}
        <main className="flex-1 overflow-hidden relative min-w-0">
          {/* Analysis execution HUD overlay */}
          {isAnalyzing && (
            <div className="absolute inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center pointer-events-none transition-opacity duration-200">
              <div className="neural-glass border border-indigo-500/50 rounded-2xl px-5 sm:px-6 py-4 flex items-center gap-3.5 shadow-[0_0_30px_rgba(99,102,241,0.35)] animate-in fade-in zoom-in-95 duration-150">
                <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" />
                <div>
                  <div className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider">
                    Executing Graph Traversal & T₀ AI Risk Inference...
                  </div>
                  <div className="text-[10px] font-mono text-cyan-400 mt-0.5">
                    Model: B5_TEMPORAL_GRAPH_ML · Chronological Split Validated
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: DASHBOARD (Command Center Hero Layout) */}
          {activeTab === 'DASHBOARD' && (
            <div className="h-full w-full flex flex-col xl:grid xl:grid-cols-12 overflow-y-auto xl:overflow-hidden min-w-0">
              {/* Left Column: 23% (col-span-3) Change Summary & AST Diff */}
              <div className="w-full xl:col-span-3 border-b xl:border-b-0 xl:border-r border-slate-800/80 bg-slate-950 overflow-visible xl:overflow-hidden xl:h-full shrink-0 min-w-0">
                <ChangeSummaryPanel analysis={currentAnalysis} />
              </div>

              {/* Center Column: 52% (col-span-6) HERO Interactive Graph + Bottom Evidence Deck */}
              <div className="w-full xl:col-span-6 bg-[#030712] overflow-visible xl:overflow-hidden xl:h-full flex flex-col relative min-w-0">
                {/* Center Top HERO: Change-Risk Graph Canvas */}
                <div className="w-full min-h-[380px] h-[450px] xl:h-auto xl:flex-1 overflow-hidden relative min-w-0">
                  <GraphCanvas 
                    graph={currentAnalysis.graph} 
                    selectedNode={selectedNode}
                    onSelectNode={setSelectedNode}
                  />
                </div>

                {/* Center Bottom: Bottom Evidence Deck */}
                <BottomEvidenceDeck 
                  analysis={currentAnalysis}
                  onNavigateToTests={() => setActiveTab('TESTS')}
                  onSelectEvidence={(evId) => console.log('Selected evidence:', evId)}
                />
              </div>

              {/* Right Column: 25% (col-span-3) AI Risk Intelligence & Radial Score Gauge */}
              <div className="w-full xl:col-span-3 border-t xl:border-t-0 xl:border-l border-slate-800/80 bg-slate-950 overflow-visible xl:overflow-hidden xl:h-full shrink-0 min-w-0">
                <RiskEvidencePanel 
                  analysis={currentAnalysis}
                  selectedNode={selectedNode}
                  onClearSelectedNode={() => setSelectedNode(null)}
                  onSelectEvidence={(evId) => console.log('Selected evidence:', evId)}
                />
              </div>
            </div>
          )}

          {/* TAB 2: REPOSITORIES */}
          {activeTab === 'REPOSITORIES' && (
            <RepositoryExplorerView 
              selectedRepository={selectedRepo}
              onSelectRepository={handleSelectRepository}
              onSelectCommitAndAnalyze={handleSelectCommitAndAnalyze}
              onOpenImportModal={() => setIsImportModalOpen(true)}
            />
          )}

          {/* TAB 3: CHANGE_ANALYSIS */}
          {activeTab === 'CHANGE_ANALYSIS' && (
            <div className="h-full w-full flex flex-col lg:grid lg:grid-cols-12 overflow-y-auto lg:overflow-hidden min-w-0">
              <div className="w-full lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-slate-950 overflow-visible lg:overflow-hidden lg:h-full shrink-0 min-w-0">
                <ChangeSummaryPanel analysis={currentAnalysis} />
              </div>
              <div className="w-full lg:col-span-8 bg-[#030712] overflow-y-auto lg:h-full flex flex-col p-4 sm:p-6 space-y-4 min-w-0">
                <div className="neural-glass-card rounded-2xl p-5 border border-slate-800/80">
                  <h3 className="font-bold text-slate-100 text-base mb-1">
                    AST Syntax & Entity Diff Breakdown
                  </h3>
                  <p className="text-xs text-slate-400">
                    Fine-grained semantic analysis tracking method calls, schema changes, and signature mutations across project entities.
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 min-w-0">
                  {currentAnalysis.changeSummary.entities.map((entity) => (
                    <div key={entity.id} className="neural-glass-card rounded-2xl p-4 space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-400 break-all">{entity.name}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-900 border border-slate-800 text-slate-300 shrink-0">
                          {entity.type}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 break-all">{entity.path}</div>
                      <p className="text-xs text-slate-300 leading-relaxed break-words">{entity.diffSummary}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GRAPH_EXPLORER (Full-Screen HERO Canvas) */}
          {activeTab === 'GRAPH_EXPLORER' && (
            <div className="h-full w-full relative min-w-0">
              <GraphCanvas 
                graph={currentAnalysis.graph} 
                selectedNode={selectedNode}
                onSelectNode={setSelectedNode}
              />
            </div>
          )}

          {/* TAB 5: RISK_IMPACT */}
          {activeTab === 'RISK_IMPACT' && (
            <div className="h-full w-full flex flex-col lg:grid lg:grid-cols-12 overflow-y-auto lg:overflow-hidden min-w-0">
              <div className="w-full lg:col-span-7 bg-[#030712] min-h-[380px] h-[450px] lg:h-full overflow-hidden relative min-w-0">
                <GraphCanvas 
                  graph={currentAnalysis.graph} 
                  selectedNode={selectedNode}
                  onSelectNode={setSelectedNode}
                />
              </div>
              <div className="w-full lg:col-span-5 border-t lg:border-t-0 lg:border-l border-slate-800/80 bg-slate-950 overflow-visible lg:overflow-hidden lg:h-full min-w-0">
                <RiskEvidencePanel 
                  analysis={currentAnalysis}
                  selectedNode={selectedNode}
                  onClearSelectedNode={() => setSelectedNode(null)}
                  onSelectEvidence={(evId) => console.log('Selected evidence:', evId)}
                />
              </div>
            </div>
          )}

          {/* TAB 6: TESTS (Test Scope) */}
          {activeTab === 'TESTS' && (
            <TestRecommendationTable analysis={currentAnalysis} />
          )}

          {/* TAB 7: EXPLANATION */}
          {activeTab === 'EXPLANATION' && (
            <div className="h-full w-full overflow-y-auto p-4 sm:p-6 space-y-6 bg-[#030712] min-w-0">
              <div className="neural-glass-card rounded-2xl p-4 sm:p-6 border border-slate-800/80 space-y-3 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>Evidence-Grounded AI Explanation</span>
                  </span>
                  <span className="font-mono text-xs text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 shrink-0">
                    Engine: {currentAnalysis.explanation.generatedBy}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-100 break-words">
                  {currentAnalysis.explanation.summary}
                </h2>
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed break-words">
                  <strong className="text-indigo-400 block mb-1">Causal Rationale & Pathway Analysis:</strong>
                  {currentAnalysis.explanation.whyRisky}
                </div>
                <div className="bg-amber-950/30 border border-amber-800/50 p-4 rounded-xl text-xs text-amber-300 leading-relaxed break-words">
                  <strong className="block mb-1">Prescribed Mitigation:</strong>
                  {currentAnalysis.explanation.suggestedMitigation}
                </div>
              </div>

              {/* Point-in-time evidence list */}
              <div className="space-y-3 min-w-0">
                <h3 className="font-mono text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Attributed Point-in-Time Evidence ({currentAnalysis.evidence.length} signals)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
                  {currentAnalysis.evidence.map((ev) => (
                    <div key={ev.id} className="neural-glass-card rounded-2xl p-4 space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-mono font-bold text-indigo-400 break-all">{ev.sourceReference}</span>
                        <span className="font-mono text-[10px] text-slate-500 shrink-0">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed break-words">{ev.summary}</p>
                      <div className="text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800 flex justify-between">
                        <span>Signal: {ev.type}</span>
                        <span className="text-indigo-400 font-bold">Contribution: {(ev.weight * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: WHAT_IF */}
          {activeTab === 'WHAT_IF' && (
            <WhatIfReleaseView 
              analysis={currentAnalysis} 
              onRecordDecision={handleRecordDecision} 
            />
          )}

          {/* TAB 9: RELEASE_DECISION */}
          {activeTab === 'RELEASE_DECISION' && (
            <WhatIfReleaseView 
              analysis={currentAnalysis} 
              onRecordDecision={handleRecordDecision} 
            />
          )}

          {/* TAB 10: HISTORY (Historical Outcomes) */}
          {activeTab === 'HISTORY' && (
            <HistoryFeedbackView 
              onSelectAnalysis={handleSelectAnalysisKey} 
            />
          )}

          {/* TAB 11: RESEARCH (Research Evaluation) */}
          {activeTab === 'RESEARCH' && (
            <ResearchEvaluationView />
          )}

          {/* TAB 12: SECURITY (Security & Leakage Gate) */}
          {activeTab === 'SECURITY' && (
            <SecurityAuditView />
          )}
        </main>
      </div>

      {/* Import Repository Modal */}
      <ImportRepositoryModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleNewRepoImported}
      />
    </div>
  );
};
