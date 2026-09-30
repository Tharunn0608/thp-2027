import React, { useState } from 'react';
import { 
  GitBranch, 
  ShieldCheck, 
  AlertTriangle, 
  Sliders, 
  CheckCircle, 
  ArrowRight,
  TrendingDown,
  Info,
  ShieldAlert,
  Zap,
  CheckCircle2,
  Clock,
  Layers,
  Lock
} from 'lucide-react';
import { WhatIfScenario, AnalysisResult } from '../../types.ts';

interface WhatIfReleaseViewProps {
  analysis: AnalysisResult;
  onRecordDecision: (status: 'RELEASE' | 'RELEASE_WITH_MITIGATION' | 'TEST_MORE' | 'DELAY', rationale: string) => void;
}

export const WhatIfReleaseView: React.FC<WhatIfReleaseViewProps> = ({ analysis, onRecordDecision }) => {
  const { whatIfScenarios, risk } = analysis;
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(whatIfScenarios[0]?.id || '');
  const [decisionRationale, setDecisionRationale] = useState<string>('');
  const [decisionSubmitted, setDecisionSubmitted] = useState<boolean>(false);
  const [lastRecordedStatus, setLastRecordedStatus] = useState<string>('');

  const activeScenario = whatIfScenarios.find(s => s.id === selectedScenarioId) || whatIfScenarios[0];

  const handleDecisionSubmit = (status: 'RELEASE' | 'RELEASE_WITH_MITIGATION' | 'TEST_MORE' | 'DELAY') => {
    const finalRationale = decisionRationale || `Decision executed under ${activeScenario?.name || 'standard'} strategy.`;
    onRecordDecision(status, finalRationale);
    setLastRecordedStatus(status);
    setDecisionSubmitted(true);
  };

  const getExposureBadge = (exposure: WhatIfScenario['estimatedExposure']) => {
    switch (exposure) {
      case 'HIGH':
        return 'bg-rose-950/80 text-rose-300 border-rose-800/80 shadow-[0_0_8px_rgba(244,63,94,0.3)]';
      case 'CONTROLLED':
        return 'bg-amber-950/80 text-amber-300 border-amber-800/80 shadow-[0_0_8px_rgba(245,158,11,0.3)]';
      case 'LOW':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80 shadow-[0_0_8px_rgba(16,185,129,0.3)]';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#030712] text-slate-200 p-4 sm:p-6 overflow-y-auto space-y-6 min-w-0">
      {/* 1. Header Banner */}
      <div className="neural-glass-card rounded-2xl p-4 sm:p-5 border border-slate-800/80 min-w-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs font-semibold uppercase tracking-wider mb-1">
              <Sliders className="w-4 h-4" />
              <span>What-If Simulation Engine</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100">
              Controlled Release Scenarios & Human Decision Gate
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed break-words">
              Evaluate simulated risk mitigation trajectories across deployment topologies (Canary 10%, Canary 25%, Direct Release). What-If models provide decision intelligence; release authorization remains strictly governed by release engineers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-slate-950/80 p-2.5 sm:p-3 rounded-xl border border-slate-800 text-xs shrink-0 font-mono">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Baseline Risk</span>
              <span className="text-sm sm:text-base font-bold text-slate-100">{risk.score}/100</span>
            </div>
            <div className="h-7 w-px bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Risk Level</span>
              <span className="text-xs sm:text-sm font-bold text-amber-400">{risk.level}</span>
            </div>
            <div className="h-7 w-px bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Target Commit</span>
              <span className="text-xs font-bold text-indigo-300">{analysis.commitSha.substring(0, 7)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Premium Interactive Scenario Cards Grid */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Simulation Topologies ({whatIfScenarios.length} Scenarios)</span>
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            Select a card to project residual exposure and operational requirements
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-0">
          {whatIfScenarios.map((scenario) => {
            const isSelected = scenario.id === selectedScenarioId;
            const riskDelta = scenario.estimatedRiskScore - risk.score;

            return (
              <div
                key={scenario.id}
                onClick={() => setSelectedScenarioId(scenario.id)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden min-w-0 ${
                  isSelected 
                    ? 'neural-glass border-indigo-500/80 shadow-[0_0_25px_rgba(99,102,241,0.25)] ring-1 ring-indigo-500/50' 
                    : 'neural-glass-subtle border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                {/* Active Selection Glow Dot */}
                {isSelected && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
                )}

                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <span className="font-bold text-sm text-slate-100 break-words">{scenario.name}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0 ${getExposureBadge(scenario.estimatedExposure)}`}>
                      {scenario.estimatedExposure}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-3 mb-4 leading-relaxed break-words">
                    {scenario.description}
                  </p>
                </div>

                <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-mono">Estimated Score</div>
                    <div className="text-lg sm:text-xl font-mono font-extrabold text-slate-100">
                      {scenario.estimatedRiskScore} <span className="text-xs text-slate-500 font-normal">/ 100</span>
                    </div>
                  </div>

                  {riskDelta < 0 ? (
                    <div className="flex items-center gap-1 text-emerald-400 text-xs font-mono font-bold bg-emerald-950/70 px-2.5 py-1 rounded-lg border border-emerald-800/60 shadow-[0_0_8px_rgba(16,185,129,0.25)] shrink-0">
                      <TrendingDown className="w-3.5 h-3.5" />
                      <span>{riskDelta} pts</span>
                    </div>
                  ) : (
                    <div className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800 shrink-0">
                      Direct Exposure
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Deep Dive into Selected Scenario */}
      {activeScenario && (
        <div className="neural-glass-card rounded-2xl p-4 sm:p-5 border border-slate-800/80 space-y-4 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-2">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 break-words">
              <Info className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Scenario Invariants: {activeScenario.name}</span>
            </h3>
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-800/60 text-indigo-300 shrink-0">
              Residual Risk Tier: <strong>{activeScenario.residualRisk}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs min-w-0">
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 space-y-2 min-w-0">
              <span className="font-mono text-indigo-400 uppercase text-[11px] font-bold tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>Operational Assumptions</span>
              </span>
              <ul className="space-y-1.5 text-slate-300 text-xs pl-1">
                {activeScenario.assumptions.map((ass, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                    <span className="break-words">{ass}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 space-y-2 min-w-0">
              <span className="font-mono text-emerald-400 uppercase text-[11px] font-bold tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Prescribed Safeguards & Mitigations</span>
              </span>
              <ul className="space-y-1.5 text-slate-300 text-xs pl-1">
                {activeScenario.recommendedActions.map((act, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span className="break-words">{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 4. Human Release Decision Terminal */}
      <div className="neural-glass rounded-2xl p-4 sm:p-6 border border-indigo-500/40 shadow-2xl relative overflow-hidden min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.3)] shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Human Release Engineering Decision Gate
              </h3>
              <p className="text-[11px] text-slate-400">
                Mandatory human authorization checkpoint before binary promotion or merge.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 shrink-0">
            <span>Commit: <strong className="text-slate-200">{analysis.commitSha.substring(0, 7)}</strong></span>
            <span>·</span>
            <span className="text-amber-400 font-bold">{analysis.risk.score}/100 {analysis.risk.level}</span>
          </div>
        </div>

        {/* Audit Rationale Input */}
        <div className="my-4 min-w-0">
          <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
            Engineering Rationale & Approval Audit Log
          </label>
          <input
            type="text"
            value={decisionRationale}
            onChange={(e) => setDecisionRationale(e.target.value)}
            placeholder="Specify verification evidence, canary parameters, or mitigation conditions..."
            className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans"
          />
        </div>

        {/* Action Decision Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* 1. RELEASE WITH MITIGATION */}
            <button
              onClick={() => handleDecisionSubmit('RELEASE_WITH_MITIGATION')}
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs font-semibold shadow-[0_4px_16px_rgba(99,102,241,0.4)] transition-all flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>RELEASE WITH MITIGATION</span>
            </button>

            {/* 2. DIRECT RELEASE */}
            <button
              onClick={() => handleDecisionSubmit('RELEASE')}
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-[0_4px_16px_rgba(16,185,129,0.3)] transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>RELEASE (DIRECT)</span>
            </button>

            {/* 3. TEST MORE */}
            <button
              onClick={() => handleDecisionSubmit('TEST_MORE')}
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700/80 transition-all"
            >
              <span>REQUEST P0 TESTS</span>
            </button>

            {/* 4. HOLD / DELAY RELEASE */}
            <button
              onClick={() => handleDecisionSubmit('DELAY')}
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800 text-rose-300 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>HOLD RELEASE</span>
            </button>
          </div>

          {/* Submission confirmation banner */}
          {decisionSubmitted && (
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/80 px-3 py-1.5 rounded-lg border border-emerald-800/80 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Status recorded: {lastRecordedStatus}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
