import React, { useState } from 'react';
import { 
  Sparkles, 
  Clock, 
  Activity, 
  History, 
  CheckSquare, 
  AlertTriangle, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight,
  Info,
  Maximize2,
  Minimize2,
  Play
} from 'lucide-react';
import { AnalysisResult, EvidenceItem } from '../../types.ts';

interface BottomEvidenceDeckProps {
  analysis: AnalysisResult;
  onNavigateToTests?: () => void;
  onSelectEvidence?: (id: string) => void;
}

export const BottomEvidenceDeck: React.FC<BottomEvidenceDeckProps> = ({
  analysis,
  onNavigateToTests,
  onSelectEvidence
}) => {
  const [activeDeckTab, setActiveDeckTab] = useState<'WHY_RISK' | 'TEMPORAL' | 'RUNTIME' | 'INCIDENTS' | 'TESTS'>('WHY_RISK');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { explanation, evidence, recommendedTests, testMetrics } = analysis;

  const temporalEvidence = evidence.filter(e => e.type === 'temporal');
  const runtimeEvidence = evidence.filter(e => e.type === 'runtime');
  const historyEvidence = evidence.filter(e => e.type === 'history');

  return (
    <div className="border-t border-slate-800/80 bg-slate-950/85 backdrop-blur-md flex flex-col shrink-0 transition-all duration-300 min-w-0">
      {/* Deck Tab Bar Header */}
      <div className="min-h-11 py-1 px-3 sm:px-4 border-b border-slate-800/70 flex items-center justify-between z-10 bg-slate-900/40 gap-2 min-w-0">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 min-w-0 flex-1">
          <button
            onClick={() => { setActiveDeckTab('WHY_RISK'); setIsCollapsed(false); }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 whitespace-nowrap ${
              activeDeckTab === 'WHY_RISK' && !isCollapsed
                ? 'bg-indigo-600/90 text-white shadow-[0_2px_8px_rgba(99,102,241,0.35)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Why This Risk?</span>
          </button>

          <button
            onClick={() => { setActiveDeckTab('TEMPORAL'); setIsCollapsed(false); }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 whitespace-nowrap ${
              activeDeckTab === 'TEMPORAL' && !isCollapsed
                ? 'bg-indigo-600/90 text-white shadow-[0_2px_8px_rgba(99,102,241,0.35)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Temporal Evidence</span>
            <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.2 rounded-full border border-slate-800">
              {temporalEvidence.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveDeckTab('RUNTIME'); setIsCollapsed(false); }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 whitespace-nowrap ${
              activeDeckTab === 'RUNTIME' && !isCollapsed
                ? 'bg-indigo-600/90 text-white shadow-[0_2px_8px_rgba(99,102,241,0.35)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>Runtime Evidence</span>
            <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.2 rounded-full border border-slate-800">
              {runtimeEvidence.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveDeckTab('INCIDENTS'); setIsCollapsed(false); }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 whitespace-nowrap ${
              activeDeckTab === 'INCIDENTS' && !isCollapsed
                ? 'bg-indigo-600/90 text-white shadow-[0_2px_8px_rgba(99,102,241,0.35)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <History className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Historical Incidents</span>
            <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.2 rounded-full border border-slate-800">
              {historyEvidence.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveDeckTab('TESTS'); setIsCollapsed(false); }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 whitespace-nowrap ${
              activeDeckTab === 'TESTS' && !isCollapsed
                ? 'bg-indigo-600/90 text-white shadow-[0_2px_8px_rgba(99,102,241,0.35)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Recommended Tests</span>
            <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded-full border border-emerald-800/60 font-bold">
              {recommendedTests.length}
            </span>
          </button>
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 sm:px-2 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 text-xs font-mono flex items-center gap-1 transition-colors shrink-0"
          title={isCollapsed ? "Expand Bottom Deck" : "Collapse Bottom Deck"}
        >
          {isCollapsed ? (
            <>
              <span className="hidden sm:inline">Expand</span>
              <Maximize2 className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              <span className="hidden sm:inline">Collapse</span>
              <Minimize2 className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {/* Deck Content Area */}
      {!isCollapsed && (
        <div className="h-52 max-h-60 overflow-y-auto p-3 sm:p-4 text-xs min-w-0">
          {/* TAB 1: Why This Risk? */}
          {activeDeckTab === 'WHY_RISK' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 min-w-0">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between min-w-0">
                <div>
                  <div className="text-[10px] font-mono uppercase text-indigo-400 font-semibold mb-1 flex items-center gap-1">
                    <Info className="w-3 h-3 shrink-0" />
                    <span>Executive Summary</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-xs break-words">
                    {explanation.summary}
                  </p>
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-2 pt-2 border-t border-slate-800 truncate">
                  Engine: {explanation.generatedBy}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between min-w-0">
                <div>
                  <div className="text-[10px] font-mono uppercase text-rose-400 font-semibold mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    <span>Causal Path & Hazard Drivers</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-xs break-words">
                    {explanation.whyRisky}
                  </p>
                </div>
                <div className="text-[10px] text-amber-400 font-mono mt-2 pt-2 border-t border-slate-800 truncate">
                  Blast Radius: {analysis.blastRadius.directCount} direct, {analysis.blastRadius.indirectCount} indirect
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40 flex flex-col justify-between min-w-0">
                <div>
                  <div className="text-[10px] font-mono uppercase text-amber-300 font-semibold mb-1 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 shrink-0" />
                    <span>Recommended Mitigation</span>
                  </div>
                  <p className="text-amber-200/90 leading-relaxed text-xs font-medium break-words">
                    {explanation.suggestedMitigation}
                  </p>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-2 pt-2 border-t border-amber-800/40 flex items-center justify-between">
                  <span>Confidence: {(analysis.risk.confidence * 100).toFixed(0)}%</span>
                  <span className="text-amber-300">Strategy: Canary</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Temporal Evidence */}
          {activeDeckTab === 'TEMPORAL' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pb-1">
                <span>Frozen Point-in-Time Sequence (Strict $T_0$ Cutoff: {new Date(analysis.predictionTimeT0).toUTCString()})</span>
                <span className="text-cyan-400 font-semibold">Temporal Guard: ACTIVE</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {temporalEvidence.map((ev) => (
                  <div 
                    key={ev.id}
                    onClick={() => onSelectEvidence?.(ev.id)}
                    className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-cyan-400 font-mono text-[11px] font-semibold">{ev.sourceReference}</span>
                      <span className="text-slate-500 font-mono text-[10px]">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-300 text-xs">{ev.summary}</p>
                    <div className="mt-1.5 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                      <span>Signal Contribution:</span>
                      <span className="text-indigo-400 font-semibold">{(ev.weight * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Runtime Evidence */}
          {activeDeckTab === 'RUNTIME' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pb-1">
                <span>Observed Live Telemetry (OpenTelemetry, Prometheus & Service Mesh)</span>
                <span className="text-sky-400 font-semibold">P95 Latency & Load Traces</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {runtimeEvidence.map((ev) => (
                  <div 
                    key={ev.id}
                    onClick={() => onSelectEvidence?.(ev.id)}
                    className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-sky-500/40 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sky-400 font-mono text-[11px] font-semibold flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        {ev.sourceReference}
                      </span>
                      <span className="text-slate-500 font-mono text-[10px]">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-300 text-xs">{ev.summary}</p>
                    <div className="mt-1.5 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                      <span>Impact Weight:</span>
                      <span className="text-sky-400 font-semibold">{(ev.weight * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Historical Incidents */}
          {activeDeckTab === 'INCIDENTS' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pb-1">
                <span>Correlated Historical Rollbacks & Outages (Pre-$T_0$)</span>
                <span className="text-amber-400 font-semibold">Chronological Memory</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {historyEvidence.map((ev) => (
                  <div 
                    key={ev.id}
                    onClick={() => onSelectEvidence?.(ev.id)}
                    className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-amber-400 font-mono text-[11px] font-semibold flex items-center gap-1">
                        <History className="w-3 h-3" />
                        {ev.sourceReference}
                      </span>
                      <span className="text-slate-500 font-mono text-[10px]">{new Date(ev.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-300 text-xs">{ev.summary}</p>
                    <div className="mt-1.5 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                      <span>Causal Affinity:</span>
                      <span className="text-amber-400 font-semibold">{(ev.weight * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: Recommended Tests */}
          {activeDeckTab === 'TESTS' && (
            <div className="space-y-3 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <span>Suite Reduction: <strong className="text-emerald-400 font-mono font-bold">{testMetrics.testReductionPercent}%</strong></span>
                  <span className="text-slate-600 hidden sm:inline">·</span>
                  <span>Failure Retention: <strong className="text-indigo-400 font-mono font-bold">{testMetrics.projectedFailureDetectionRetained}%</strong></span>
                  <span className="text-slate-600 hidden sm:inline">·</span>
                  <span>CI Time Saved: <strong className="text-slate-200 font-mono">~{testMetrics.estimatedTimeSavedSeconds}s</strong></span>
                </div>
                {onNavigateToTests && (
                  <button
                    onClick={onNavigateToTests}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold shrink-0"
                  >
                    <span>Open Full Test Suite</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 min-w-0">
                {recommendedTests.slice(0, 3).map((test) => (
                  <div key={test.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1 min-w-0">
                        <span className="font-mono text-xs font-bold text-slate-200 truncate" title={test.name}>{test.name}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold shrink-0 ${
                          test.priority === 'P0' ? 'text-rose-400 bg-rose-950/80 border border-rose-800' : 'text-amber-400 bg-amber-950/80 border border-amber-800'
                        }`}>
                          {test.priority}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-2 break-words">{test.reason}</div>
                    </div>
                    <div className="mt-2 text-[10px] font-mono text-slate-500 flex items-center justify-between pt-1 border-t border-slate-800/60">
                      <span>{(test.estimatedDurationMs / 1000).toFixed(1)}s</span>
                      <span>Corr: {test.historicalFailureCorrelation != null ? `${(test.historicalFailureCorrelation * 100).toFixed(0)}%` : '—'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
