import { ChangedEntity, NodeType } from '../types.ts';

export interface DiffParseResult {
  filesChanged: number;
  insertions: number;
  deletions: number;
  changeType: 'API' | 'DATABASE' | 'BUSINESS_LOGIC' | 'CONFIGURATION' | 'INFRASTRUCTURE' | 'SECURITY';
  entities: ChangedEntity[];
}

export class ChangeDetectorService {
  /**
   * Parses git unified diff or patch text and classifies changed entities.
   * Extracts functions, classes, schemas, and configurations.
   */
  public static parseDiff(diffText: string): DiffParseResult {
    const lines = diffText.split('\n');
    let insertions = 0;
    let deletions = 0;
    const filesSet = new Set<string>();
    const entities: ChangedEntity[] = [];

    let currentFile = '';
    let currentKind: 'added' | 'modified' | 'deleted' = 'modified';
    let currentLinesAdded = 0;
    let currentLinesDeleted = 0;
    let fileHunks: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Git diff header: diff --git a/src/path b/src/path
      if (line.startsWith('diff --git')) {
        if (currentFile) {
          const classified = this.classifyEntity(currentFile, currentKind, currentLinesAdded, currentLinesDeleted, fileHunks);
          if (classified) entities.push(classified);
        }

        const match = line.match(/diff --git a\/(.+?) b\/(.+)/);
        currentFile = match ? match[2] : 'unknown';
        filesSet.add(currentFile);
        currentKind = 'modified';
        currentLinesAdded = 0;
        currentLinesDeleted = 0;
        fileHunks = [];
        continue;
      }

      if (line.startsWith('new file mode')) {
        currentKind = 'added';
      } else if (line.startsWith('deleted file mode')) {
        currentKind = 'deleted';
      }

      // Track additions and deletions
      if (line.startsWith('+') && !line.startsWith('+++')) {
        insertions++;
        currentLinesAdded++;
        fileHunks.push(line.slice(1).trim());
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        deletions++;
        currentLinesDeleted++;
      }
    }

    if (currentFile) {
      const classified = this.classifyEntity(currentFile, currentKind, currentLinesAdded, currentLinesDeleted, fileHunks);
      if (classified) entities.push(classified);
    }

    // Determine overall change type based on entity classifications
    const changeType = this.inferChangeType(entities);

    return {
      filesChanged: filesSet.size > 0 ? filesSet.size : 1,
      insertions,
      deletions,
      changeType,
      entities
    };
  }

  /**
   * Classifies a file and its hunks into structured entity types (function, api, schema, config, file).
   */
  private static classifyEntity(
    filePath: string,
    changeKind: 'added' | 'modified' | 'deleted',
    linesAdded: number,
    linesDeleted: number,
    hunks: string[]
  ): ChangedEntity {
    const fileName = filePath.split('/').pop() || filePath;
    const lowerPath = filePath.toLowerCase();

    // 1. Database Schema migrations or models
    if (lowerPath.includes('migration') || lowerPath.includes('schema') || lowerPath.endsWith('.sql')) {
      const sqlTable = hunks.find(h => /create table|alter table|add constraint/i.test(h));
      const entityName = sqlTable ? sqlTable.slice(0, 40) : `Schema: ${fileName}`;
      return {
        id: `ent-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: 'schema',
        name: entityName,
        path: filePath,
        changeKind,
        linesAdded,
        linesDeleted,
        diffSummary: `Database schema modification in ${fileName} with table/constraint updates.`
      };
    }

    // 2. API Routes / Endpoints
    if (lowerPath.includes('route') || lowerPath.includes('controller') || lowerPath.includes('api')) {
      const routeHunk = hunks.find(h => /(get|post|put|delete|patch)\s*\(|app\.(get|post)|router\.(get|post)/i.test(h));
      const entityName = routeHunk ? routeHunk.slice(0, 45) : `API Endpoint in ${fileName}`;
      return {
        id: `ent-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: 'api',
        name: entityName,
        path: filePath,
        changeKind,
        linesAdded,
        linesDeleted,
        diffSummary: `REST API route signature or handler modification in ${fileName}.`
      };
    }

    // 3. Infrastructure & Configs
    if (lowerPath.endsWith('.yml') || lowerPath.endsWith('.yaml') || lowerPath.includes('docker') || lowerPath.includes('k8s') || lowerPath.includes('config')) {
      return {
        id: `ent-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: 'config',
        name: `Config: ${fileName}`,
        path: filePath,
        changeKind,
        linesAdded,
        linesDeleted,
        diffSummary: `Infrastructure or operational configuration changed in ${fileName}.`
      };
    }

    // 4. Methods / Functions in application code
    const funcHunk = hunks.find(h => /function\s+([a-zA-Z0-9_]+)|([a-zA-Z0-9_]+)\s*\([^)]*\)\s*[:{]|const\s+([a-zA-Z0-9_]+)\s*=\s*(async\s*)?\(/i.test(h));
    const funcName = funcHunk ? funcHunk.replace(/[{;]/g, '').trim().slice(0, 50) : `${fileName}`;

    return {
      id: `ent-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: funcHunk ? 'function' : 'file',
      name: funcName,
      path: filePath,
      changeKind,
      linesAdded,
      linesDeleted,
      diffSummary: `Core implementation updated in ${fileName} (+${linesAdded} / -${linesDeleted} lines).`
    };
  }

  /**
   * Infers top-level change taxonomy
   */
  private static inferChangeType(entities: ChangedEntity[]): 'API' | 'DATABASE' | 'BUSINESS_LOGIC' | 'CONFIGURATION' | 'INFRASTRUCTURE' | 'SECURITY' {
    if (entities.some(e => e.type === 'schema')) return 'DATABASE';
    if (entities.some(e => e.type === 'api')) return 'API';
    if (entities.some(e => e.type === 'config')) return 'CONFIGURATION';
    if (entities.some(e => e.path.toLowerCase().includes('auth') || e.path.toLowerCase().includes('security') || e.name.toLowerCase().includes('token'))) {
      return 'SECURITY';
    }
    return 'BUSINESS_LOGIC';
  }
}
