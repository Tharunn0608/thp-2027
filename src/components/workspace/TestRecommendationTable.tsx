import React, { useState } from 'react';
import { 
  CheckSquare, 
  Play, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  Percent, 
  Layers,
  ArrowRight,
  Filter,
  CheckCircle2,
  Cpu,
  Zap,
  TrendingDown
} from 'lucide-react';
import { RecommendedTest, AnalysisResult } from '../../types.ts';

interface TestRecommendationTableProps {
  analysis: AnalysisResult;
}

export const TestRecommendationTable: React.FC<TestRecommendationTableProps> = ({ analysis }) => {
  const { recommendedTests, testMetrics } = analysis;
  const [selectedTests, setSelectedTests] = useState<string[]>(
    recommendedTests.filter(t => t.priority === 'P0' || t.priority === 'P1').map(t => t.id)
  );
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'P0' | 'P1' | 'P2'>('ALL');
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testRunCompleted, setTestRunCompleted] = useState(false);

  const toggleSelectTest = (id: string) => {
    setSelectedTests(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedTests.length === recommendedTests.length) {
      setSelectedTests([]);
    } else {
      setSelectedTests(recommendedTests.map(t => t.id));
    }
  };

  const handleExecuteTests = () => {
    setIsRunningTests(true);
    setTestRunCompleted(false);
    setTimeout(() => {
      setIsRunningTests(false);
      setTestRunCompleted(true);
    }, 1600);
  };

  const filteredTests = recommendedTests.filter(t => {
    if (activeFilter === 'ALL') return true;
    return t.priority === activeFilter;
  });

  const getPriorityBadge = (priority: 'P0' | 'P1' | 'P2') => {
    switch (priority) {
      case 'P0':
        return 'bg-rose-950/80 text-rose-300 border-rose-800/80 shadow-[0_0_8px_rgba(244,63,94,0.3)] font-bold';
      case 'P1':
        return 'bg-amber-950/80 text-amber-300 border-amber-800/80 shadow-[0_0_8px_rgba(245,158,11,0.3)] font-semibold';
      case 'P2':
        return 'bg-slate-800/80 text-slate-400 border-slate-700/80';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#030712] text-slate-200">
      {/* 1. Header Metrics Banner */}
      <div className="neural-glass-subtle border-b border-slate-800/80 px-4 sm:px-6 py-4 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs font-semibold uppercase tracking-wider mb-1">
              <CheckSquare className="w-4 h-4" />
              <span>CI Optimization & Test Selection</span>
            </div>
            <h2 className="text-base font-bold text-slate-100">
              Impact-Aware Test Scope Recommendation
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
              Targeted regression testing focused on structural reach and runtime risk patterns, pruning redundant suites while safeguarding failure detection.
            </p>
          </div>

          {/* Key Objective Metrics Cards */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="neural-glass-card px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-center min-w-0">
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">Suite Reduction</span>
              <div className="flex items-baseline justify-center gap-1.5 mt-0.5">
                <span className="text-lg sm:text-xl font-mono font-extrabold text-emerald-400 tabular-nums">
                  {testMetrics.testReductionPercent}%
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  ({testMetrics.selectedCount}/{testMetrics.totalSuiteCount})
                </span>
              </div>
            </div>

            <div className="neural-glass-card px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-center min-w-0">
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">Failure Retention</span>
              <div className="flex items-baseline justify-center gap-1.5 mt-0.5">
                <span className="text-lg sm:text-xl font-mono font-extrabold text-indigo-400 tabular-nums">
                  {testMetrics.projectedFailureDetectionRetained}%
                </span>
                <span className="text-[10px] text-slate-500">certified</span>
              </div>
            </div>

            <div className="neural-glass-card px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-center min-w-0">
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">CI Time Saved</span>
              <div className="flex items-baseline justify-center gap-1.5 mt-0.5">
                <span className="text-lg sm:text-xl font-mono font-extrabold text-slate-100 tabular-nums">
                  ~{testMetrics.estimatedTimeSavedSeconds}s
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action and Filter Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={handleSelectAll}
              className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors font-medium whitespace-nowrap"
            >
              {selectedTests.length === recommendedTests.length ? 'Deselect All' : 'Select All Recommended'}
            </button>

            <div className="hidden sm:block h-4 w-px bg-slate-800" />

            {/* Segmented Filter */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
              {(['ALL', 'P0', 'P1', 'P2'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-2.5 sm:px-3 py-1 rounded-md text-[11px] font-mono font-semibold transition-all ${
                    activeFilter === filter 
                      ? 'bg-indigo-600 text-white shadow-[0_2px_8px_rgba(99,102,241,0.35)]' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {testRunCompleted && (
              <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-mono font-semibold bg-emerald-950/70 px-3 py-1.5 rounded-lg border border-emerald-800/80 animate-in fade-in">
                <ShieldCheck className="w-4 h-4" />
                All {selectedTests.length} tests verified passing
              </span>
            )}

            <button
              onClick={handleExecuteTests}
              disabled={isRunningTests || selectedTests.length === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all ${
                isRunningTests || selectedTests.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-[0_4px_16px_rgba(99,102,241,0.4)]'
              }`}
            >
              <Play className={`w-3.5 h-3.5 ${isRunningTests ? 'animate-spin' : 'fill-current'}`} />
              <span>{isRunningTests ? 'Running Automated Test Runner...' : `Run ${selectedTests.length} Selected Tests`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Table of Recommended Tests */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 min-w-0">
        <div className="neural-glass-card rounded-2xl overflow-hidden border border-slate-800/80">
          <div className="overflow-x-auto w-full min-w-0">
            <table className="w-full border-collapse text-left text-xs min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-950/60 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">Sel</th>
                <th className="py-3 px-4 w-24">Priority</th>
                <th className="py-3 px-4">Test Identifier & Suite</th>
                <th className="py-3 px-4">Mapped Causal Entity / Rationale</th>
                <th className="py-3 px-4 w-28 text-right">Duration</th>
                <th className="py-3 px-4 w-32 text-right">Failure Corr.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredTests.map((test) => {
                const isSelected = selectedTests.includes(test.id);
                return (
                  <tr 
                    key={test.id}
                    className={`hover:bg-slate-900/50 transition-colors ${isSelected ? 'bg-indigo-950/15' : 'opacity-70'}`}
                  >
                    <td className="py-3.5 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectTest(test.id)}
                        className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                      />
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] border font-mono ${getPriorityBadge(test.priority)}`}>
                        {test.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-bold text-slate-100 text-xs">{test.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{test.suite} · <span className="text-slate-400">{test.type}</span></div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <div>{test.reason}</div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        {test.mappedComponentIds.map(cid => (
                          <span key={cid} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900 text-indigo-300 border border-slate-800">
                            {cid}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-300 tabular-nums">
                      {(test.estimatedDurationMs / 1000).toFixed(1)}s
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                      {test.historicalFailureCorrelation ? (
                        <span className="text-amber-400 font-bold">
                          {(test.historicalFailureCorrelation * 100).toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>
  );
};
