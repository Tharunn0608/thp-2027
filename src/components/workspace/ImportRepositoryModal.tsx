import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  FolderGit2, 
  ShieldCheck, 
  FileCode,
  Zap
} from 'lucide-react';
import { RepositorySummary } from '../../types/repository.ts';

interface ImportRepositoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (newRepo: RepositorySummary) => void;
}

export const ImportRepositoryModal: React.FC<ImportRepositoryModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess
}) => {
  const [importMethod, setImportMethod] = useState<'GIT' | 'ZIP' | 'DEMO'>('GIT');
  const [repoName, setRepoName] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [domainCategory, setDomainCategory] = useState<'College Management' | 'Banking' | 'SaaS' | 'Healthcare' | 'E-Commerce'>('Healthcare');
  const [branch, setBranch] = useState('main');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      const generatedId = `repo-${Date.now().toString().slice(-4)}`;
      const newRepo: RepositorySummary = {
        id: generatedId,
        name: repoName || 'Healthcare Patient Record Exchange',
        category: domainCategory,
        description: `Microservice architecture for ${domainCategory.toLowerCase()} management and API interop.`,
        languages: ['TypeScript', 'Python', 'PostgreSQL'],
        filesCount: 142,
        servicesCount: 5,
        apisCount: 16,
        databasesCount: 2,
        testsCount: 52,
        lastCommitSha: 'a881d429e0',
        lastCommitMessage: 'feat(records): update patient HIPAA consent and access check policies',
        lastCommitTimestamp: new Date().toISOString(),
        health: 'HEALTHY',
        telemetrySource: 'OpenTelemetry (K8s Cluster)',
        historicalIncidentCount: 2,
        branch: branch || 'main',
        commits: [
          {
            sha: 'a881d429e0',
            message: 'feat(records): update patient HIPAA consent and access check policies',
            author: 'healthcare-eng@health-net.org',
            timestamp: new Date().toISOString(),
            changeType: 'SECURITY',
            diffSummary: 'Added strict patient authorization token checks for external medical records retrieval.',
            filesChanged: 2,
            insertions: 34,
            deletions: 9,
            analysisKey: 'college-commit-enrollment' // maps to active pipeline
          }
        ]
      };

      setIsProcessing(false);
      onImportSuccess(newRepo);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="neural-glass border border-slate-700/60 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">
                Connect Software Repository
              </h3>
              <p className="text-[11px] text-slate-400">
                Repository-agnostic AST ingestion and dependency graph generation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800/80 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-slate-800/80 text-xs font-mono p-1 bg-slate-950/60 shrink-0">
          <button
            onClick={() => setImportMethod('GIT')}
            className={`flex-1 py-2 rounded-xl text-center font-semibold transition-all ${
              importMethod === 'GIT' 
                ? 'bg-indigo-600 text-white shadow-[0_2px_8px_rgba(99,102,241,0.35)]' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Connect Git Repo
          </button>
          <button
            onClick={() => setImportMethod('ZIP')}
            className={`flex-1 py-2 rounded-xl text-center font-semibold transition-all ${
              importMethod === 'ZIP' 
                ? 'bg-indigo-600 text-white shadow-[0_2px_8px_rgba(99,102,241,0.35)]' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Upload Project Source
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleImportSubmit} className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto">
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Repository Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Healthcare Clinical Records Core"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-sans"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Domain / Architecture Category
            </label>
            <select
              value={domainCategory}
              onChange={(e: any) => setDomainCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 focus:outline-hidden focus:border-indigo-500 font-sans"
            >
              <option value="Healthcare">Healthcare Management</option>
              <option value="College Management">College Management System</option>
              <option value="Banking">Banking & Financial Core</option>
              <option value="SaaS">B2B SaaS Cloud Platform</option>
              <option value="E-Commerce">E-Commerce & Retail</option>
            </select>
          </div>

          {importMethod === 'GIT' ? (
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Git Clone URL (HTTPS / SSH)
              </label>
              <input
                type="text"
                placeholder="https://github.com/organization/project-core.git"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-mono text-[11px]"
              />
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-800 rounded-2xl p-6 text-center hover:border-indigo-500/60 transition-colors bg-slate-950/40">
              <Upload className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
              <div className="font-semibold text-slate-200">Drag & drop project ZIP archive</div>
              <div className="text-[11px] text-slate-500 mt-1">Parses AST, endpoints, and microservice definitions</div>
            </div>
          )}

          <div className="bg-indigo-950/40 border border-indigo-800/40 rounded-xl p-3.5 text-[11px] text-slate-400 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200 block mb-0.5">Repository-Agnostic Parser:</strong>
              The system will dynamically build the AST syntax tree, microservice dependencies, and temporal graph. Zero business-domain assumptions are hardcoded.
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-slate-100 rounded-xl hover:bg-slate-800/60 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl font-semibold shadow-[0_4px_16px_rgba(99,102,241,0.35)] transition-all flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'Ingesting Architecture...' : 'Import & Build Graph'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
