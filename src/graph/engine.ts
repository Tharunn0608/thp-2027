import { SoftwareGraph, GraphNode, GraphEdge } from '../types.ts';

export interface TraversalResult {
  startNodeId: string;
  directNodes: GraphNode[];
  indirectNodes: GraphNode[];
  criticalNodes: GraphNode[];
  paths: {
    targetId: string;
    path: string[];
    depth: number;
    hasRuntimeTelemetry: boolean;
  }[];
  maxDepth: number;
}

export class SoftwareRiskGraphEngine {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: GraphEdge[] = [];
  private adjacencyList: Map<string, { target: string; edge: GraphEdge }[]> = new Map();

  constructor(graph?: SoftwareGraph) {
    if (graph) {
      this.loadGraph(graph);
    }
  }

  public loadGraph(graph: SoftwareGraph): void {
    this.nodes.clear();
    this.edges = [...graph.edges];
    this.adjacencyList.clear();

    for (const node of graph.nodes) {
      this.nodes.set(node.id, { ...node });
      this.adjacencyList.set(node.id, []);
    }

    for (const edge of graph.edges) {
      // Directed forward traversal (callees, publishes, writes, exposes)
      const forwardList = this.adjacencyList.get(edge.source) || [];
      forwardList.push({ target: edge.target, edge });
      this.adjacencyList.set(edge.source, forwardList);

      // Inverted structural link for CONTAINS so changing a member function bubbles impact up to the containing service
      if (edge.type === 'CONTAINS') {
        const reverseList = this.adjacencyList.get(edge.target) || [];
        reverseList.push({ target: edge.source, edge: { ...edge, id: `${edge.id}-rev`, source: edge.target, target: edge.source } });
        this.adjacencyList.set(edge.target, reverseList);
      }
    }
  }

  public getNode(nodeId: string): GraphNode | undefined {
    return this.nodes.get(nodeId);
  }

  public getAllNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }

  public getAllEdges(): GraphEdge[] {
    return [...this.edges];
  }

  /**
   * Filter graph strictly up to cutoff T0
   * Any edge or observation created AFTER T0 is excluded to prevent future leakage.
   */
  public getSnapshotAtT0(cutoffT0: string): SoftwareGraph {
    const cutoffTime = new Date(cutoffT0).getTime();

    const validEdges = this.edges.filter(edge => {
      if (!edge.timestamp) return true; // Static structural edges
      return new Date(edge.timestamp).getTime() <= cutoffTime;
    });

    return {
      snapshotId: `snap-t0-${Date.now()}`,
      timestamp: cutoffT0,
      nodes: this.getAllNodes(),
      edges: validEdges
    };
  }

  /**
   * Traverses downstream impact from a root changed entity
   */
  public calculateDownstreamImpact(startNodeId: string, maxHops: number = 4): TraversalResult {
    const visited = new Set<string>();
    const queue: { nodeId: string; depth: number; path: string[]; hasRt: boolean }[] = [
      { nodeId: startNodeId, depth: 0, path: [startNodeId], hasRt: false }
    ];

    visited.add(startNodeId);

    const directNodes: GraphNode[] = [];
    const indirectNodes: GraphNode[] = [];
    const criticalNodes: GraphNode[] = [];
    const paths: TraversalResult['paths'] = [];
    let maxEncounteredDepth = 0;

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.depth > 0) {
        const node = this.nodes.get(current.nodeId);
        if (node) {
          if (current.depth === 1) {
            directNodes.push(node);
          } else {
            indirectNodes.push(node);
          }

          if (node.criticality === 'CRITICAL') {
            criticalNodes.push(node);
          }

          paths.push({
            targetId: current.nodeId,
            path: current.path.map(id => this.nodes.get(id)?.name || id),
            depth: current.depth,
            hasRuntimeTelemetry: current.hasRt
          });

          if (current.depth > maxEncounteredDepth) {
            maxEncounteredDepth = current.depth;
          }
        }
      }

      if (current.depth < maxHops) {
        const outgoing = this.adjacencyList.get(current.nodeId) || [];
        for (const { target, edge } of outgoing) {
          if (!visited.has(target)) {
            visited.add(target);
            const isRt = edge.sourceType === 'runtime' || current.hasRt;
            queue.push({
              nodeId: target,
              depth: current.depth + 1,
              path: [...current.path, target],
              hasRt: isRt
            });
          }
        }
      }
    }

    return {
      startNodeId,
      directNodes,
      indirectNodes,
      criticalNodes,
      paths,
      maxDepth: maxEncounteredDepth
    };
  }
}
