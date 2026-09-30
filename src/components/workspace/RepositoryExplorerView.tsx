import React from 'react';
import { 
  FolderGit2, 
  Layers, 
  FileCode2, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  GitBranch, 
  Clock, 
  Activity, 
  PlusCircle, 
  ShieldCheck, 
  Zap, 
  Server,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { RepositorySummary } from '../../types/repository.ts';
import { DEMO_REPOSITORIES } from '../../data/repositories.ts';

interface RepositoryExplorerViewProps {
  selectedRepository: RepositorySummary;
  onSelectRepository: (repo: RepositorySummary) => void;
  onSelectCommitAndAnalyze: (repo: RepositorySummary, commitSha: string) => void;
  onOpenImportModal: () => void;
}

export const RepositoryExplorerView: React.FC<RepositoryExplorerViewProps> = ({
  selectedRepository,
  onSelectRepository,
  onSelectCommitAndAnalyze,
  onOpenImportModal
}) => {
  return (
    <div className="flex flex-col h-full bg-[#030712] text-slate-200 p-4 sm:p-6 overflow-y-auto space-y-6 min-w-0">
      {/* 1. Header Hero Banner */}
      <div className="neural-glass rounded-2xl p-4 sm:p-6 border border-indigo-900/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden min-w-0">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 min-w-0">
          <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs font-semibold uppercase tracking-wider mb-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Repository-Agnostic Intelligence Platform</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-100">
            Software Project Registry & Structural Topologies
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed break-words">
            The change-risk engine operates uniformly across arbitrary software domains. Select any target repository below to load its project-specific architecture, dependency topologies, runtime telemetry streams, and historical incidents.
          </p>
        </div>

        <button
          onClick={onOpenImportModal}
          className="relative z-10 flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs font-semibold shadow-[0_4px_16px_rgba(99,102,241,0.35)] transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Connect Repository</span>
        </button>
      </div>

      {/* 2. Repositories Grid */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-indigo-400" />
            <span>Connected Repositories ({DEMO_REPOSITORIES.length})</span>
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            Click any repository card to switch active workspace context
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-0">
          {DEMO_REPOSITORIES.map((repo) => {
            const isSelected = repo.id === selectedRepository.id;
            return (
              <div
                key={repo.id}
                onClick={() => onSelectRepository(repo)}
                className={`cursor-pointer rounded-2xl p-4 sm:p-5 border transition-all flex flex-col justify-between relative overflow-hidden min-w-0 ${
                  isSelected
                    ? 'neural-glass border-indigo-500 ring-1 ring-indigo-500/50 shadow-[0_0_25px_rgba(99,102,241,0.25)]'
                    : 'neural-glass-subtle border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 shrink-0">
                      {repo.category}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border shrink-0 ${
                      repo.health === 'HEALTHY' ? 'text-emerald-300 bg-emerald-950/80 border-emerald-800/80' : 'text-amber-300 bg-amber-950/80 border-amber-800/80'
                    }`}>
                      {repo.health}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-100 text-sm mb-1 leading-snug break-words">
                    {repo.name}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed break-words">
                    {repo.description}
                  </p>
                </div>

                <div className="border-t border-slate-800/80 pt-3 space-y-1.5 text-[11px] font-mono text-slate-400">
                  <div className="flex justify-between gap-2">
                    <span className="truncate">Services / APIs:</span>
                    <span className="text-slate-200 font-semibold shrink-0">{repo.servicesCount} srv / {repo.apisCount} api</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="truncate">Regression Tests:</span>
                    <span className="text-slate-200 font-semibold shrink-0">{repo.testsCount} tests</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="truncate">Prior Incidents:</span>
                    <span className="text-slate-200 font-semibold shrink-0">{repo.historicalIncidentCount} recorded</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Selected Repository Deep-Dive */}
      <div className="neural-glass-card rounded-2xl p-4 sm:p-6 border border-slate-800/80 space-y-5 min-w-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800/80 gap-3 min-w-0">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold bg-indigo-600/30 text-indigo-300 rounded-full border border-indigo-500/40 shrink-0">
                ACTIVE REPOSITORY
              </span>
              <h3 className="text-base font-bold text-slate-100 break-words">
                {selectedRepository.name}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-slate-400 mt-1 font-mono">
              <span className="flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>branch: <strong className="text-slate-200">{selectedRepository.branch}</strong></span>
              </span>
              <span className="hidden sm:inline">·</span>
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Telemetry: <strong className="text-slate-200">{selectedRepository.telemetrySource}</strong></span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {selectedRepository.languages.map((lang, idx) => (
              <span key={idx} className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[11px] font-mono text-slate-300">
                {lang}
              </span>
            ))}
          </div>
        </div>

        {/* Repository Architectural Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-3 min-w-0">
          <div className="bg-slate-950/80 p-3 sm:p-3.5 rounded-xl border border-slate-800/80 min-w-0">
            <span className="text-[10px] font-mono text-slate-500 uppercase block truncate">Source Files</span>
            <span className="text-lg sm:text-xl font-bold text-slate-200 font-mono mt-0.5 truncate block">{selectedRepository.filesCount}</span>
          </div>
          <div className="bg-slate-950/80 p-3 sm:p-3.5 rounded-xl border border-slate-800/80 min-w-0">
            <span className="text-[10px] font-mono text-slate-500 uppercase block truncate">Services</span>
            <span className="text-lg sm:text-xl font-bold text-indigo-300 font-mono mt-0.5 truncate block">{selectedRepository.servicesCount}</span>
          </div>
          <div className="bg-slate-950/80 p-3 sm:p-3.5 rounded-xl border border-slate-800/80 min-w-0">
            <span className="text-[10px] font-mono text-slate-500 uppercase block truncate">Endpoints (APIs)</span>
            <span className="text-lg sm:text-xl font-bold text-slate-200 font-mono mt-0.5 truncate block">{selectedRepository.apisCount}</span>
          </div>
          <div className="bg-slate-950/80 p-3 sm:p-3.5 rounded-xl border border-slate-800/80 min-w-0">
            <span className="text-[10px] font-mono text-slate-500 uppercase block truncate">Databases</span>
            <span className="text-lg sm:text-xl font-bold text-slate-200 font-mono mt-0.5 truncate block">{selectedRepository.databasesCount}</span>
          </div>
          <div className="bg-slate-950/80 p-3 sm:p-3.5 rounded-xl border border-slate-800/80 min-w-0 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase block truncate">Test Suites</span>
            <span className="text-lg sm:text-xl font-bold text-emerald-400 font-mono mt-0.5 truncate block">{selectedRepository.testsCount}</span>
          </div>
        </div>

        {/* Commits & Changes for this Repository */}
        <div className="space-y-3 pt-2 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-1">
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Target Commits Ready for Change-Risk Analysis</span>
            </h4>
            <span className="text-[11px] text-slate-500 font-mono">
              Click &quot;Analyze This Change&quot; to execute dynamic graph traversal & AI prediction
            </span>
          </div>

          <div className="space-y-2.5 min-w-0">
            {selectedRepository.commits.map((c) => (
              <div
                key={c.sha}
                className="bg-slate-950/80 border border-slate-800/80 hover:border-indigo-500/50 rounded-xl p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all min-w-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-indigo-400 shrink-0">
                      {c.sha.substring(0, 7)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-900 border border-slate-800 text-slate-300 shrink-0">
                      {c.changeType}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      by {c.author} · {new Date(c.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-200 break-words">
                    {c.message}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5 break-words">
                    {c.diffSummary}
                  </p>
                </div>

                <button
                  onClick={() => onSelectCommitAndAnalyze(selectedRepository, c.sha)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs font-semibold shadow-[0_2px_10px_rgba(99,102,241,0.35)] transition-all shrink-0 self-start md:self-auto"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Analyze This Change</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
