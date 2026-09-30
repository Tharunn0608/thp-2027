import React, { useState } from 'react';
import { 
  History, 
  GitCommit, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  ShieldAlert, 
  ArrowRight,
  TrendingDown,
  RotateCcw,
  Activity,
  CheckCircle
} from 'lucide-react';
import { PRECONFIGURED_ANALYSES } from '../../mockData.ts';

interface HistoryFeedbackViewProps {
  onSelectAnalysis: (key: string) => void;
}

export const HistoryFeedbackView: React.FC<HistoryFeedbackViewProps> = ({ onSelectAnalysis }) => {
  const [activeTab, setActiveTab] = useState<'RECORDS' | 'TIMELINE'>('RECORDS');

  const historyItems = [
    {
      commitSha: 'c891a45e21',
      changeId: '#COL-124',
      service: 'CampusOS Student Service',
      summary: 'feat(enrollment): validate student prerequisite GPA and bursar clearance',
      riskScore: 78,
      riskLevel: 'HIGH',
      t0Timestamp: '2026-09-17T09:00:00Z',
      decision: 'RELEASE_WITH_MITIGATION (Canary 10%)',
      actualOutcome: {
        deploymentStatus: 'SUCCESS',
        incidentOccurred: false,
        latencyDelta: '+0.4%',
        errorRateDelta: '0.0%',
        testsExecuted: 12,
        suiteSavings: '81.25%'
      },
      key: 'college-commit-enrollment'
    },
    {
      commitSha: 'b882f019c4',
      changeId: '#BNK-902',
      service: 'Banking Wire Service',
      summary: 'security(aml): update high-value wire validation thresholds & OFAC checks',
      riskScore: 92,
      riskLevel: 'CRITICAL',
      t0Timestamp: '2026-09-17T08:45:00Z',
      decision: 'RELEASE_WITH_MITIGATION (Multi-Sign Canary)',
      actualOutcome: {
        deploymentStatus: 'SUCCESS',
        incidentOccurred: false,
        latencyDelta: '+0.2%',
        errorRateDelta: '0.0%',
        testsExecuted: 18,
        suiteSavings: '88.5%'
      },
      key: 'banking-commit-aml'
    },
    {
      commitSha: 'c452f89a91',
      changeId: '#452',
      service: 'Payment Service',
      summary: 'refactor(payment): calculateTotal() precision & VAT calculation',
      riskScore: 87,
      riskLevel: 'HIGH',
      t0Timestamp: '2026-09-17T09:00:00Z',
      decision: 'RELEASE_WITH_MITIGATION (Canary 10%)',
      actualOutcome: {
        deploymentStatus: 'SUCCESS',
        incidentOccurred: false,
        latencyDelta: '+1.2%',
        errorRateDelta: '-0.1%',
        testsExecuted: 5,
        suiteSavings: '98.7%'
      },
      key: 'commit-452-high-risk'
    },
    {
      commitSha: 'a301d4187e',
      changeId: '#301',
      service: 'Documentation',
      summary: 'docs(readme): update notification queue delivery architecture',
      riskScore: 12,
      riskLevel: 'LOW',
      t0Timestamp: '2026-09-17T08:30:00Z',
      decision: 'RELEASE (Direct Merge)',
      actualOutcome: {
        deploymentStatus: 'SUCCESS',
        incidentOccurred: false,
        latencyDelta: '0.0%',
        errorRateDelta: '0.0%',
        testsExecuted: 1,
        suiteSavings: '99.7%'
      },
      key: 'commit-301-low-risk'
    },
    {
      commitSha: 'b443e11029',
      changeId: '#443',
      service: 'Kafka Events Queue',
      summary: 'feat(queue): partition key rebalancing for order streaming',
      riskScore: 78,
      riskLevel: 'HIGH',
      t0Timestamp: '2026-08-28T16:15:00Z',
      decision: 'RELEASE (Direct)',
      actualOutcome: {
        deploymentStatus: 'ROLLED_BACK',
        incidentOccurred: true,
        incidentRef: 'INC-102',
        latencyDelta: '+64.0%',
        errorRateDelta: '+4.2%',
        testsExecuted: 12,
        suiteSavings: '96.8%'
      },
      key: 'commit-452-high-risk'
    }
  ];

  return (
    <div className="flex flex-col h-full bg-[#030712] text-slate-200 p-4 sm:p-6 overflow-y-auto space-y-6 min-w-0">
      {/* 1. Header */}
      <div className="neural-glass-card rounded-2xl p-4 sm:p-5 border border-slate-800/80 min-w-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs font-semibold uppercase tracking-wider mb-1">
              <History className="w-4 h-4" />
              <span>Feedback Loop & Empirical Truth</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100">
              Analysis History & Ground-Truth Outcome Validation
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed break-words">
              Permanent immutable record linking prediction-time graph states ($T_0$) with post-release outcomes, telemetry anomalies, and test effectiveness.
            </p>
          </div>

          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono shrink-0">
            <button
              onClick={() => setActiveTab('RECORDS')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'RECORDS' 
                  ? 'bg-indigo-600 text-white shadow-[0_2px_8px_rgba(99,102,241,0.35)]' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Outcome Table
            </button>
            <button
              onClick={() => setActiveTab('TIMELINE')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'TIMELINE' 
                  ? 'bg-indigo-600 text-white shadow-[0_2px_8px_rgba(99,102,241,0.35)]' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Causal Timeline
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Content */}
      {activeTab === 'RECORDS' ? (
        <div className="neural-glass-card rounded-2xl overflow-hidden border border-slate-800/80 min-w-0">
          <div className="overflow-x-auto w-full min-w-0">
            <table className="w-full text-left text-xs min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-950/60 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Commit & Service</th>
                  <th className="py-3 px-4">T₀ Cutoff</th>
                  <th className="py-3 px-4">Predicted Risk</th>
                  <th className="py-3 px-4">Human Decision</th>
                  <th className="py-3 px-4">Actual Production Outcome</th>
                  <th className="py-3 px-4 text-right">Suite Savings</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {historyItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-100 flex items-center gap-1.5">
                        <GitCommit className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>{item.changeId}</span>
                        <span className="text-slate-500 font-normal">({item.commitSha.substring(0, 7)})</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{item.summary}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px] tabular-nums">
                      {new Date(item.t0Timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                        item.riskLevel === 'CRITICAL'
                          ? 'bg-rose-950/80 text-rose-300 border-rose-800/80'
                          : item.riskLevel === 'HIGH' 
                          ? 'bg-amber-950/80 text-amber-300 border-amber-800/80' 
                          : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80'
                      }`}>
                        {item.riskScore}/100 {item.riskLevel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-300 font-medium">
                      {item.decision}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.actualOutcome.deploymentStatus === 'ROLLED_BACK' ? (
                        <div className="flex items-center gap-1.5 text-rose-400 font-semibold text-xs">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Rolled Back ({item.actualOutcome.incidentRef})</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Stable in Production</span>
                        </div>
                      )}
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                        Latency: {item.actualOutcome.latencyDelta} · Errors: {item.actualOutcome.errorRateDelta}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-400 font-bold tabular-nums">
                      {item.actualOutcome.suiteSavings}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onSelectAnalysis(item.key)}
                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-200 px-3 py-1.5 bg-indigo-950/60 hover:bg-indigo-900/60 rounded-lg border border-indigo-800/60 transition-colors shadow-xs"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Causal Timeline View */
        <div className="space-y-4 max-w-3xl mx-auto py-2 min-w-0 w-full">
          {historyItems.map((item, idx) => (
            <div key={idx} className="relative pl-8 border-l-2 border-indigo-500/40 pb-6 last:pb-0 min-w-0">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-950 border-2 border-indigo-500 flex items-center justify-center shadow-[0_0_8px_rgba(99,102,241,0.8)]">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              </div>
              <div className="neural-glass-card rounded-2xl p-4 sm:p-5 space-y-3 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-mono text-indigo-400 font-bold text-sm break-words">{item.changeId} — {item.service}</span>
                  <span className="text-slate-500 font-mono text-[11px] shrink-0">{new Date(item.t0Timestamp).toUTCString()}</span>
                </div>
                <div className="font-semibold text-slate-100 text-sm break-words">{item.summary}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-950/80 p-3 rounded-xl border border-slate-800 font-mono min-w-0">
                  <div className="truncate">Predicted Risk: <strong className="text-slate-100">{item.riskScore}/100 ({item.riskLevel})</strong></div>
                  <div className="truncate">Outcome: <strong className={item.actualOutcome.deploymentStatus === 'SUCCESS' ? 'text-emerald-400' : 'text-rose-400'}>{item.actualOutcome.deploymentStatus}</strong></div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed break-words">
                  Mitigation applied: <span className="text-slate-200 font-medium">{item.decision}</span>. Selected regression tests confirmed zero downstream regressions.
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Feedback Loop Guardrail Note */}
      <div className="neural-glass-card rounded-2xl p-4 text-xs text-slate-400 leading-relaxed border border-slate-800/80">
        <span className="font-semibold text-slate-200 block mb-1">
          Feedback Learning Architecture (Phase 17)
        </span>
        <p>
          Once an actual deployment outcome is observed (post-release telemetry, test results, or rollback incidents), it is stored as an immutable ground-truth event. The temporal engine allows this newly minted history to inform future predictions for subsequent changes without retrospectively contaminating past evaluation sets.
        </p>
      </div>
    </div>
  );
};
