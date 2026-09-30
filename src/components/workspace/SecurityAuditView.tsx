import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  Key, 
  Database,
  FileCheck2,
  AlertTriangle
} from 'lucide-react';
import { TemporalLeakageAuditor } from '../../graph/temporal_auditor.ts';

export const SecurityAuditView: React.FC = () => {
  const [testResults, setTestResults] = useState<{ testName: string; passed: boolean; message: string }[]>(
    TemporalLeakageAuditor.runAutomatedLeakageSuite()
  );
  const [isRunning, setIsRunning] = useState(false);

  const handleRerunSuite = () => {
    setIsRunning(true);
    setTimeout(() => {
      setTestResults(TemporalLeakageAuditor.runAutomatedLeakageSuite());
      setIsRunning(false);
    }, 600);
  };

  const securityControls = [
    {
      domain: 'Temporal Leakage Prevention',
      status: 'ENFORCED',
      control: 'T0 Point-in-Time Wall',
      description: 'Strict logical gate excluding telemetry windows, incidents, and graph edge additions occurring after prediction timestamp T0.'
    },
    {
      domain: 'LLM Prompt-Injection Boundary',
      status: 'ENFORCED',
      control: 'Read-Only Evidence Sanitizer',
      description: 'The explanation service passes sanitized JSON payloads containing pre-extracted evidence IDs only. User commits cannot override risk scoring.'
    },
    {
      domain: 'Data Integrity & Ground Truth Separation',
      status: 'ENFORCED',
      control: 'Prediction vs. Outcome Isolation',
      description: 'Pre-T0 predictions and post-T0 deployment outcomes are persisted in disjoint data models to preserve unbiased empirical evaluation.'
    },
    {
      domain: 'Role-Based Access Control (RBAC)',
      status: 'ACTIVE',
      control: 'Least-Privilege Authorization',
      description: 'Separate permissions for Release Engineers (decision authority), Developers (submission), and Researchers (metrics export).'
    },
    {
      domain: 'SSRF & Repository Ingestion Defense',
      status: 'PROTECTED',
      control: 'URL & Scheme Allowlisting',
      description: 'Outbound fetch restrictions blocking AWS/GCP metadata endpoints (169.254.169.254) and internal subnet traversal.'
    }
  ];

  return (
    <div className="flex flex-col h-full bg-[#030712] text-slate-200 p-4 sm:p-6 overflow-y-auto space-y-6 min-w-0">
      {/* 1. Header */}
      <div className="neural-glass-card rounded-2xl p-4 sm:p-5 border border-slate-800/80 min-w-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs font-semibold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Zero-Trust Architecture</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100">
              Security, RBAC & Temporal Leakage Certification Gate
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed break-words">
              Automated certification of empirical validity, strict point-in-time ($T_0$) isolation, and prompt injection threat boundaries.
            </p>
          </div>

          <button
            onClick={handleRerunSuite}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs font-semibold shadow-[0_4px_16px_rgba(99,102,241,0.35)] transition-all shrink-0"
          >
            <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>Run P0 Leakage Gate Checks</span>
          </button>
        </div>
      </div>

      {/* 2. Automated P0 Checks */}
      <div className="neural-glass-card rounded-2xl p-4 sm:p-5 border border-slate-800/80 space-y-3 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Automated P0 Temporal Leakage Suite</span>
          </span>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800/80 shrink-0">
            {testResults.filter(t => t.passed).length} / {testResults.length} Checks Certified Passing
          </span>
        </div>

        <div className="space-y-2.5 min-w-0">
          {testResults.map((t, idx) => (
            <div 
              key={idx}
              className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 flex items-start justify-between gap-3 text-xs min-w-0"
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                {t.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-100 font-mono text-xs break-words">{t.testName}</div>
                  <div className="text-slate-400 mt-0.5 leading-relaxed break-words">{t.message}</div>
                </div>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 border ${
                t.passed ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' : 'bg-rose-950/80 text-rose-300 border-rose-800'
              }`}>
                {t.passed ? 'PASS' : 'FAIL'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Security Governance Controls */}
      <div className="neural-glass-card rounded-2xl p-4 sm:p-5 border border-slate-800/80 space-y-3 min-w-0">
        <span className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider block">
          Security Controls & Threat Boundary Verification
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs min-w-0">
          {securityControls.map((sc, i) => (
            <div key={i} className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between min-w-0">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-indigo-400 font-bold text-[11px] uppercase tracking-wider truncate">
                    {sc.domain}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-slate-900 text-slate-300 border border-slate-800 shrink-0">
                    {sc.status}
                  </span>
                </div>
                <div className="font-bold text-slate-100 mb-1 break-words">{sc.control}</div>
                <p className="text-slate-400 leading-relaxed text-[11px] break-words">
                  {sc.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Compliance Declaration */}
      <div className="neural-glass-card rounded-2xl p-4 text-xs text-slate-400 leading-relaxed border border-slate-800/80">
        <span className="font-semibold text-slate-200 block mb-1">
          Security Principle Compliance (Section 40)
        </span>
        <p>
          Security controls safeguard system confidentiality and integrity without violating temporal correctness, provenance, or reproducibility. Sensitive source code snippets are minimized, external LLM calls transmit only sanitized structured metadata, and all decision events are immutably logged with actor identities.
        </p>
      </div>
    </div>
  );
};
