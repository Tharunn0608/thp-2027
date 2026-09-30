import React from 'react';
import { 
  ShieldAlert, 
  Sparkles, 
  FileText, 
  Radio, 
  History, 
  Activity, 
  Info, 
  Flame, 
  Layers, 
  CheckCircle2, 
  AlertTriangle,
  Server,
  Database,
  Cpu,
  ArrowUpRight,
  ShieldCheck,
  X
} from 'lucide-react';
import { AnalysisResult, GraphNode, EvidenceItem } from '../../types.ts';

interface RiskEvidencePanelProps {
  analysis: AnalysisResult;
  selectedNode: GraphNode | null;
  onClearSelectedNode: () => void;
  onSelectEvidence: (evidenceId: string) => void;
}

export const RiskEvidencePanel: React.FC<RiskEvidencePanelProps> = ({ 
  analysis, 
  selectedNode, 
  onClearSelectedNode,
  onSelectEvidence
}) => {
  const { risk, explanation, evidence, blastRadius, affectedComponents } = analysis;

  // Radial gauge geometry math
  const radius = 64;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const safeScore = Math.min(Math.max(risk.score, 0), 100);
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;

  const getRiskColors = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return {
          stroke: '#f43f5e',
          text: 'text-rose-400',
          bg: 'bg-rose-950/60',
          border: 'border-rose-800/80',
          glow: 'rgba(244, 63, 94, 0.45)'
        };
      case 'HIGH':
        return {
          stroke: '#f59e0b',
          text: 'text-amber-400',
          bg: 'bg-amber-950/60',
          border: 'border-amber-800/80',
          glow: 'rgba(245, 158, 11, 0.45)'
        };
      case 'MEDIUM':
        return {
          stroke: '#eab308',
          text: 'text-yellow-400',
          bg: 'bg-yellow-950/60',
          border: 'border-yellow-800/80',
          glow: 'rgba(234, 179, 8, 0.4)'
        };
      default:
        return {
          stroke: '#10b981',
          text: 'text-emerald-400',
          bg: 'bg-emerald-950/60',
          border: 'border-emerald-800/80',
          glow: 'rgba(16, 185, 129, 0.4)'
        };
    }
  };

  const riskColors = getRiskColors(risk.level);

  const getEvidenceIcon = (type: EvidenceItem['type']) => {
    switch (type) {
      case 'runtime':
        return <Activity className="w-3.5 h-3.5 text-sky-400" />;
      case 'history':
        return <History className="w-3.5 h-3.5 text-amber-400" />;
      case 'temporal':
        return <Radio className="w-3.5 h-3.5 text-cyan-400" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="flex flex-col gap-4 p-3.5 sm:p-4 text-slate-200 text-xs overflow-y-auto h-full neural-glass-subtle min-w-0">
      {/* 1. Header: AI Risk Intelligence Banner */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 min-w-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-6 h-6 rounded-md bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Cpu className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono truncate">
              AI Risk Intelligence
            </h2>
            <div className="text-[10px] text-slate-400 font-mono truncate">
              {risk.modelId} · {risk.modelVersion}
            </div>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-700/60 shrink-0">
          T₀ Evaluated
        </span>
      </div>

      {/* 2. Interactive Node Inspector (Shown when clicked on graph) */}
      {selectedNode && (
        <div className="p-3.5 rounded-xl bg-gradient-to-b from-indigo-950/50 to-slate-900/90 border border-indigo-500/50 shadow-lg shadow-indigo-950/40 relative min-w-0">
          <button 
            onClick={onClearSelectedNode}
            className="absolute top-3 right-3 p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            title="Deselect Node"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="text-[10px] font-mono uppercase tracking-wider text-indigo-300 mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
            Selected Graph Entity
          </div>
          <div className="font-bold text-slate-100 text-sm break-words pr-6">{selectedNode.name}</div>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400 font-mono mt-0.5">
            <span>Type: <strong className="text-slate-200">{selectedNode.type}</strong></span>
            {selectedNode.criticality && (
              <>
                <span>·</span>
                <span className={`px-1.5 py-0.2 rounded font-bold ${
                  selectedNode.criticality === 'CRITICAL' ? 'text-rose-400 bg-rose-950/80 border border-rose-800' : 'text-amber-400 bg-amber-950/80 border border-amber-800'
                }`}>
                  {selectedNode.criticality}
                </span>
              </>
            )}
          </div>
          {selectedNode.metadata && (
            <div className="mt-2 text-[10px] font-mono bg-slate-950/80 p-2 rounded-lg border border-slate-800 text-slate-300 max-h-24 overflow-y-auto">
              <pre className="whitespace-pre-wrap break-all">{JSON.stringify(selectedNode.metadata, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {/* 3. HERO Radial Circular Risk Score Visualization */}
      <div className="neural-glass-card rounded-2xl p-4 flex flex-col items-center relative overflow-hidden min-w-0">
        {/* Subtle radial aura behind the gauge */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{ background: `radial-gradient(circle at center, ${riskColors.glow} 0%, transparent 70%)` }}
        />

        <div className="relative w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center my-1 shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
            {/* Background Track */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="#1e293b"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Dynamic Animated Value Arc */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke={riskColors.stroke}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              style={{
                transition: 'stroke-dashoffset 1s ease-in-out',
                filter: `drop-shadow(0 0 8px ${riskColors.glow})`
              }}
            />
          </svg>

          {/* Center Score Reading */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-extrabold text-slate-100 font-mono tracking-tight tabular-nums">
              {risk.score}
            </span>
            <span className={`text-[11px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-full mt-0.5 border ${riskColors.bg} ${riskColors.text} ${riskColors.border}`}>
              {risk.level}
            </span>
            <span className="text-[10px] text-slate-400 font-mono mt-1">
              {(risk.confidence * 100).toFixed(0)}% confidence
            </span>
          </div>
        </div>

        {/* Confidence & Calibrated Adverse Probability Metrics */}
        <div className="w-full grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-800/80 text-center min-w-0">
          <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 min-w-0">
            <div className="text-[10px] text-slate-400 font-mono uppercase truncate">Calibrated Risk</div>
            <div className="text-xs sm:text-sm font-mono font-bold text-slate-100 mt-0.5 break-words">
              {(risk.calibratedProbability * 100).toFixed(0)}% P(Adverse)
            </div>
          </div>
          <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 min-w-0">
            <div className="text-[10px] text-slate-400 font-mono uppercase truncate">Blast Reach</div>
            <div className="text-xs sm:text-sm font-mono font-bold text-amber-400 mt-0.5 truncate">
              {blastRadius.score} / 100
            </div>
          </div>
        </div>
      </div>

      {/* 4. Blast Radius & Critical Components */}
      <div className="neural-glass-card rounded-xl p-3.5 min-w-0">
        <div className="flex items-center justify-between text-xs mb-2 gap-1">
          <span className="font-semibold text-slate-200 flex items-center gap-1.5 uppercase font-mono tracking-wider text-[11px] truncate">
            <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Blast Radius Scope</span>
          </span>
          <span className="text-[11px] font-mono text-slate-400 shrink-0">
            Max {blastRadius.maxDepth} Hops
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center mb-2.5 min-w-0">
          <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 min-w-0">
            <div className="text-[10px] text-slate-400 font-mono uppercase truncate">Direct</div>
            <div className="text-sm font-bold font-mono text-slate-200 truncate">{blastRadius.directCount}</div>
          </div>
          <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 min-w-0">
            <div className="text-[10px] text-slate-400 font-mono uppercase truncate">Indirect</div>
            <div className="text-sm font-bold font-mono text-slate-200 truncate">{blastRadius.indirectCount}</div>
          </div>
          <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 min-w-0">
            <div className="text-[10px] text-rose-400 font-mono uppercase truncate">Critical</div>
            <div className="text-sm font-bold font-mono text-rose-400 truncate">{blastRadius.criticalCount}</div>
          </div>
        </div>

        {/* Critical / Affected Components Chips */}
        {affectedComponents && affectedComponents.length > 0 && (
          <div className="pt-2 border-t border-slate-800/80 min-w-0">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
              Impacted Core Components ({affectedComponents.length})
            </div>
            <div className="flex flex-wrap gap-1.5 min-w-0">
              {affectedComponents.map((comp) => {
                const compName = typeof comp === 'string' ? comp : comp.name;
                const compKey = typeof comp === 'string' ? comp : comp.id;
                return (
                  <span 
                    key={compKey}
                    title={compName}
                    className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 font-mono text-[10px] text-slate-300 flex items-center gap-1 max-w-full"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    <span className="truncate">{compName}</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 5. Evidence-Grounded AI Explanation */}
      <div className="neural-glass-card rounded-xl p-3.5 space-y-2.5 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className="font-semibold text-slate-200 flex items-center gap-1.5 uppercase font-mono tracking-wider text-[11px] truncate">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Causal Risk Explanation</span>
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 shrink-0">
            {explanation.generatedBy}
          </span>
        </div>

        <p className="text-slate-300 leading-relaxed text-xs break-words">
          {explanation.summary}
        </p>

        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80 text-xs text-slate-400 leading-relaxed break-words">
          <div className="font-semibold text-slate-200 mb-1 flex items-center gap-1 text-[11px]">
            <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Why This Risk Was Triggered:</span>
          </div>
          {explanation.whyRisky}
        </div>

        <div className="bg-amber-950/20 border border-amber-800/40 p-2.5 rounded-lg text-amber-300/90 leading-relaxed text-[11px] break-words">
          <span className="font-bold">Recommended Mitigation: </span>
          {explanation.suggestedMitigation}
        </div>
      </div>

      {/* 6. Point-in-Time Evidence List */}
      <div className="min-w-0">
        <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2">
          <span>Point-in-Time Evidence ($T_0$)</span>
          <span>{evidence.length} signals</span>
        </div>

        <div className="flex flex-col gap-2 min-w-0">
          {evidence.map((ev) => (
            <div
              key={ev.id}
              onClick={() => onSelectEvidence(ev.id)}
              className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-900/90 transition-all cursor-pointer group min-w-0"
            >
              <div className="flex items-center justify-between mb-1 gap-2 min-w-0">
                <span className="flex items-center gap-1.5 font-semibold text-slate-200 text-xs shrink-0">
                  {getEvidenceIcon(ev.type)}
                  <span className="uppercase text-[10px] font-mono tracking-wider text-slate-400">
                    {ev.type}
                  </span>
                </span>
                <span className="font-mono text-[10px] text-slate-500 truncate" title={ev.sourceReference}>
                  {ev.sourceReference}
                </span>
              </div>
              <p className="text-slate-300 group-hover:text-slate-100 transition-colors leading-relaxed text-[11px] break-words">
                {ev.summary}
              </p>
              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono border-t border-slate-800/60 pt-1">
                <span>At: {new Date(ev.timestamp).toLocaleTimeString()}</span>
                <span className="text-indigo-400 font-semibold">Weight: {(ev.weight * 100).toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
