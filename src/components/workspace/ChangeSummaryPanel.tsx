import React from 'react';
import { 
  GitCommit, 
  GitBranch, 
  ShieldAlert, 
  Clock, 
  FileCode, 
  Flame, 
  CheckCircle2, 
  ShieldCheck,
  ArrowRight,
  User,
  Calendar,
  Layers,
  ChevronRight,
  Hash
} from 'lucide-react';
import { AnalysisResult } from '../../types.ts';

interface ChangeSummaryProps {
  analysis: AnalysisResult;
}

export const ChangeSummaryPanel: React.FC<ChangeSummaryProps> = ({ analysis }) => {
  const { changeSummary, predictionTimeT0, commitSha, baseSha, risk, blastRadius } = analysis;

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-rose-950/70 text-rose-300 border-rose-800/80 shadow-[0_0_10px_rgba(244,63,94,0.3)]';
      case 'HIGH':
        return 'bg-amber-950/70 text-amber-300 border-amber-800/80 shadow-[0_0_10px_rgba(245,158,11,0.3)]';
      case 'MEDIUM':
        return 'bg-yellow-950/70 text-yellow-300 border-yellow-800/80';
      default:
        return 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80';
    }
  };

  return (
    <div className="flex flex-col gap-4 p-3.5 sm:p-4 text-slate-200 text-xs overflow-y-auto h-full neural-glass-subtle min-w-0">
      {/* 1. Commit Header & Overview Card */}
      <div className="neural-glass-card rounded-2xl p-4 space-y-2.5 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-indigo-400 shrink-0">
            <GitCommit className="w-3.5 h-3.5 shrink-0" />
            <span className="font-bold">{commitSha.substring(0, 7)}</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">Base {baseSha?.substring(0, 7) || 'HEAD~1'}</span>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0 ${getRiskBadgeColor(risk.level)}`}>
            {risk.level}
          </span>
        </div>

        <p className="font-semibold text-slate-100 text-sm leading-snug break-words">
          {changeSummary.message}
        </p>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
          <span className="flex items-center gap-1 shrink-0">
            <User className="w-3 h-3 text-slate-500 shrink-0" />
            <span>{changeSummary.author}</span>
          </span>
          <span className="text-slate-600 hidden sm:inline">·</span>
          <span className="flex items-center gap-1 font-mono shrink-0">
            <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
            <span>{new Date(predictionTimeT0).toLocaleDateString()}</span>
          </span>
        </div>
      </div>

      {/* 2. Temporal Chronology & T0 Barrier Visualization */}
      <div className="neural-glass-card rounded-2xl p-3.5 space-y-3 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className="font-semibold text-slate-200 flex items-center gap-1.5 font-mono uppercase tracking-wider text-[11px] truncate">
            <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Chronological Timeline</span>
          </span>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-800/60 flex items-center gap-1 shrink-0">
            <ShieldCheck className="w-3 h-3" />
            <span>T₀ Sealed</span>
          </span>
        </div>

        {/* T-30 → T-20 → T-10 → T0 Flow */}
        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 overflow-x-auto no-scrollbar">
          <div className="flex items-center justify-between text-[11px] font-mono min-w-[230px]">
            <div className="flex flex-col items-center">
              <span className="text-slate-500 text-[10px]">T-30m</span>
              <span className="w-2 h-2 rounded-full bg-slate-700 my-1" />
              <span className="text-[9px] text-slate-500">Baseline</span>
            </div>

            <div className="h-0.5 flex-1 bg-slate-800 mx-1 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-700 via-indigo-600 to-indigo-500 opacity-60" />
            </div>

            <div className="flex flex-col items-center">
              <span className="text-slate-400 text-[10px]">T-20m</span>
              <span className="w-2 h-2 rounded-full bg-slate-600 my-1" />
              <span className="text-[9px] text-slate-500">Telemetry</span>
            </div>

            <div className="h-0.5 flex-1 bg-slate-800 mx-1 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-indigo-400 to-cyan-400 opacity-80" />
            </div>

            <div className="flex flex-col items-center">
              <span className="text-slate-300 text-[10px]">T-10m</span>
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 my-0.5 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
              <span className="text-[9px] text-slate-400">AST Diff</span>
            </div>

            <div className="h-0.5 flex-1 bg-slate-800 mx-1 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-cyan-300" />
            </div>

            <div className="flex flex-col items-center">
              <span className="text-cyan-300 font-bold text-[10px] flex items-center gap-0.5">
                T₀
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              </span>
              <span className="w-3 h-3 rounded-full bg-cyan-400 my-0.5 shadow-[0_0_10px_rgba(6,182,212,0.9)]" />
              <span className="text-[9px] text-cyan-400 font-bold">Predict</span>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 font-mono leading-relaxed bg-slate-950/40 p-2 rounded-lg border border-slate-900 break-words">
          Strict chronological freeze: {new Date(predictionTimeT0).toUTCString()}. Zero post-T₀ telemetry or incident leakage is admitted into the graph state.
        </p>
      </div>

      {/* 3. Diff Size Metrics */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center min-w-0">
        <div className="neural-glass-card rounded-xl p-2 sm:p-2.5 min-w-0">
          <div className="text-[9px] sm:text-[10px] text-slate-400 font-mono uppercase truncate">Files</div>
          <div className="text-sm sm:text-base font-mono font-bold text-slate-100 mt-0.5 truncate">{changeSummary.filesChanged}</div>
        </div>
        <div className="neural-glass-card rounded-xl p-2 sm:p-2.5 min-w-0">
          <div className="text-[9px] sm:text-[10px] text-emerald-400 font-mono uppercase truncate">Insertions</div>
          <div className="text-sm sm:text-base font-mono font-bold text-emerald-400 mt-0.5 truncate">+{changeSummary.insertions}</div>
        </div>
        <div className="neural-glass-card rounded-xl p-2 sm:p-2.5 min-w-0">
          <div className="text-[9px] sm:text-[10px] text-rose-400 font-mono uppercase truncate">Deletions</div>
          <div className="text-sm sm:text-base font-mono font-bold text-rose-400 mt-0.5 truncate">-{changeSummary.deletions}</div>
        </div>
      </div>

      {/* 4. Changed AST Entities Breakdown */}
      <div className="min-w-0">
        <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2">
          <span>Changed AST Entities</span>
          <span className="text-slate-500">({changeSummary.entities.length})</span>
        </div>

        <div className="flex flex-col gap-2 min-w-0">
          {changeSummary.entities.map((entity) => (
            <div 
              key={entity.id}
              className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition-colors min-w-0"
            >
              <div className="flex items-start justify-between gap-1.5 mb-1 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <FileCode className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="font-mono text-xs font-semibold text-slate-200 truncate" title={entity.name}>
                    {entity.name}
                  </span>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-800 text-indigo-300 rounded shrink-0">
                  {entity.type}
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-500 truncate mb-1" title={entity.path}>
                {entity.path}
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed break-words">
                {entity.diffSummary}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Blast Radius Summary Card */}
      <div className="neural-glass-card rounded-xl p-3.5 mt-auto min-w-0">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-slate-200 flex items-center gap-1.5 font-mono uppercase tracking-wider text-[11px]">
            <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Blast Radius Summary</span>
          </span>
          <span className="font-mono font-bold text-amber-400 shrink-0">{blastRadius.score}/100</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 mb-2 font-mono">
          <div className="truncate">Direct: <span className="font-semibold text-slate-200">{blastRadius.directCount}</span></div>
          <div className="truncate">Indirect: <span className="font-semibold text-slate-200">{blastRadius.indirectCount}</span></div>
          <div className="truncate">Critical: <span className="font-semibold text-rose-400">{blastRadius.criticalCount}</span></div>
          <div className="truncate">Depth: <span className="font-semibold text-slate-200">{blastRadius.maxDepth} hops</span></div>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed border-t border-slate-800/80 pt-2 font-sans break-words">
          {blastRadius.summary}
        </p>
      </div>
    </div>
  );
};
