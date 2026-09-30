import { NodeType, EdgeType, RiskLevel, GraphNode, GraphEdge, SoftwareGraph, AnalysisResult } from '../types.ts';

export interface RepositorySummary {
  id: string;
  name: string;
  category: 'E-Commerce' | 'College Management' | 'Banking' | 'SaaS' | 'Healthcare';
  description: string;
  languages: string[];
  filesCount: number;
  servicesCount: number;
  apisCount: number;
  databasesCount: number;
  testsCount: number;
  lastCommitSha: string;
  lastCommitMessage: string;
  lastCommitTimestamp: string;
  health: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  telemetrySource: string;
  historicalIncidentCount: number;
  branch: string;
  commits: RepositoryCommit[];
}

export interface RepositoryCommit {
  sha: string;
  message: string;
  author: string;
  timestamp: string;
  changeType: 'API' | 'DATABASE' | 'BUSINESS_LOGIC' | 'CONFIGURATION' | 'INFRASTRUCTURE' | 'SECURITY';
  diffSummary: string;
  filesChanged: number;
  insertions: number;
  deletions: number;
  analysisKey: string;
}

export interface RepositoryExplorerNode {
  id: string;
  name: string;
  type: 'folder' | 'file' | 'service' | 'api' | 'database' | 'queue' | 'test' | 'deploy';
  path: string;
  children?: RepositoryExplorerNode[];
}
