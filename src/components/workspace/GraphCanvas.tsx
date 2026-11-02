import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { 
  Network, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Activity, 
  Server, 
  Database, 
  Radio, 
  Terminal, 
  Globe, 
  Search, 
  RotateCcw, 
  Flame, 
  X, 
  Crosshair, 
  ArrowRight
} from 'lucide-react';
import { SoftwareGraph, GraphNode, GraphEdge, AffectedComponent, NodeType, EdgeType } from '../../types.ts';

export interface GraphCanvasProps {
  graph: SoftwareGraph;
  onSelectNode: (node: GraphNode | null) => void;
  selectedNode: GraphNode | null;
  affectedComponents?: AffectedComponent[];
}

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: NodeType;
  criticality: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  metadata?: Record<string, any>;
  isChanged: boolean;
  status?: string;
  isDownstream: boolean;
  isDirectImpact: boolean;
  isIndirectImpact: boolean;
  depth: number;
  impactScore: number;
  reason?: string;
  pathFromChange?: string[];
  radius: number;
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  id: string;
  source: string | SimNode;
  target: string | SimNode;
  type: EdgeType;
  sourceType: 'static' | 'runtime' | 'historical' | 'inferred';
  weight?: number;
  metadata?: Record<string, any>;
  isDownstreamPath: boolean;
  isDirectPath: boolean;
  isObservedRuntime: boolean;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({ 
  graph = { nodes: [], edges: [], timestamp: '', snapshotId: '' }, 
  onSelectNode, 
  selectedNode,
  affectedComponents = []
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Filter & Search states
  const [filterLayer, setFilterLayer] = useState<'ALL' | 'SERVICES' | 'DATA' | 'CODE'>('ALL');
  const [showRuntimeOnly, setShowRuntimeOnly] = useState<boolean>(false);
  const [showAffectedOnly, setShowAffectedOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [isSimulationActive, setIsSimulationActive] = useState<boolean>(true);

  // References to preserve D3 simulation, zoom behaviors, and node positions across renders
  const simulationRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const cachedPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  // 1. Compute Downstream Blast Radius from Graph & Affected Components
  const { 
    enrichedNodes, 
    enrichedLinks, 
    rootChangedIds, 
    directImpactIds, 
    indirectImpactIds, 
    impactMetrics 
  } = useMemo(() => {
    const nodesList = graph?.nodes || [];
    const edgesList = graph?.edges || [];

    const affectedMap = new Map<string, AffectedComponent>();
    affectedComponents.forEach(aff => {
      affectedMap.set(aff.nodeId, aff);
      affectedMap.set(aff.name, aff);
    });

    // Detect root changed nodes
    const rootIds = new Set<string>();
    nodesList.forEach(n => {
      if (n.isChanged) {
        rootIds.add(n.id);
      }
    });

    // Fallback if no node has isChanged: true explicitly
    if (rootIds.size === 0 && nodesList.length > 0) {
      const candidate = nodesList.find(n => n.name.includes('validate') || n.name.includes('calculate') || n.type === 'Function');
      if (candidate) {
        rootIds.add(candidate.id);
      } else {
        rootIds.add(nodesList[0].id);
      }
    }

    // Traverse downstream graph using BFS starting from root changes
    const directSet = new Set<string>();
    const indirectSet = new Set<string>();
    const depthMap = new Map<string, number>();

    const outgoing = new Map<string, string[]>();
    edgesList.forEach(e => {
      if (!outgoing.has(e.source)) outgoing.set(e.source, []);
      outgoing.get(e.source)!.push(e.target);
    });

    rootIds.forEach(id => depthMap.set(id, 0));

    // 1-hop direct neighbors
    rootIds.forEach(rId => {
      const targets = outgoing.get(rId) || [];
      targets.forEach(tId => {
        if (!rootIds.has(tId)) {
          directSet.add(tId);
          depthMap.set(tId, 1);
        }
      });
    });

    // 2-hop+ indirect neighbors
    const queue = Array.from(directSet);
    let currentDepth = 2;
    while (queue.length > 0 && currentDepth <= 4) {
      const current = queue.shift()!;
      const neighbors = outgoing.get(current) || [];
      neighbors.forEach(nId => {
        if (!rootIds.has(nId) && !directSet.has(nId) && !indirectSet.has(nId)) {
          indirectSet.add(nId);
          depthMap.set(nId, currentDepth);
          queue.push(nId);
        }
      });
      currentDepth++;
    }

    // Merge in provided affectedComponents if available
    affectedComponents.forEach(aff => {
      if (aff.impactType === 'DIRECT') {
        directSet.add(aff.nodeId);
      } else if (aff.impactType === 'INDIRECT') {
        indirectSet.add(aff.nodeId);
      }
    });

    // Build enriched SimNodes
    const nodes: SimNode[] = nodesList.map(node => {
      const isChanged = rootIds.has(node.id) || !!node.isChanged;
      const isDirect = directSet.has(node.id);
      const isIndirect = indirectSet.has(node.id);
      const isDownstream = isDirect || isIndirect;
      const depth = depthMap.get(node.id) ?? (isDirect ? 1 : isIndirect ? 2 : 99);

      const affInfo = affectedMap.get(node.id) || affectedMap.get(node.name);

      let impactScore = 0;
      if (isChanged) impactScore = 100;
      else if (affInfo?.impactScore) impactScore = affInfo.impactScore;
      else if (isDirect) impactScore = 85;
      else if (isIndirect) impactScore = 60;

      const radius = isChanged ? 26 : isDirect ? 23 : 20;

      return {
        id: node.id,
        name: node.name,
        type: node.type,
        criticality: node.criticality || 'MEDIUM',
        metadata: node.metadata,
        isChanged,
        status: node.status,
        isDownstream,
        isDirectImpact: isDirect,
        isIndirectImpact: isIndirect,
        depth,
        impactScore,
        reason: affInfo?.reason,
        pathFromChange: affInfo?.pathFromChange,
        radius
      };
    });

    // Build enriched SimLinks
    const links: SimLink[] = edgesList.map(edge => {
      const isSourceRoot = rootIds.has(edge.source);
      const isTargetDirect = directSet.has(edge.target);
      const isSourceDirect = directSet.has(edge.source);
      const isTargetIndirect = indirectSet.has(edge.target);

      const isDirectPath = isSourceRoot && isTargetDirect;
      const isDownstreamPath = isDirectPath || (isSourceDirect && isTargetIndirect) || (isSourceRoot && (isTargetDirect || isTargetIndirect));
      const isObservedRuntime = edge.sourceType === 'runtime' || edge.type === 'OBSERVED_CALL';

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        sourceType: edge.sourceType,
        weight: edge.weight,
        metadata: edge.metadata,
        isDownstreamPath,
        isDirectPath,
        isObservedRuntime
      };
    });

    const criticalAffectedCount = nodes.filter(n => n.isDownstream && n.criticality === 'CRITICAL').length;
    const maxDepth = Math.max(0, ...Array.from(depthMap.values()).filter(d => d < 90));

    return {
      enrichedNodes: nodes,
      enrichedLinks: links,
      rootChangedIds: rootIds,
      directImpactIds: directSet,
      indirectImpactIds: indirectSet,
      impactMetrics: {
        rootCount: rootIds.size,
        directCount: directSet.size,
        indirectCount: indirectSet.size,
        totalImpacted: rootIds.size + directSet.size + indirectSet.size,
        criticalAffectedCount,
        maxDepth
      }
    };
  }, [graph, affectedComponents]);

  // 2. Filter nodes and links based on UI state
  const { filteredNodes, filteredLinks } = useMemo(() => {
    let nodes = enrichedNodes.filter(node => {
      if (filterLayer === 'SERVICES' && !(node.type === 'Service' || node.type === 'API')) return false;
      if (filterLayer === 'DATA' && !(node.type === 'Database' || node.type === 'Queue')) return false;
      if (filterLayer === 'CODE' && !(node.type === 'Function' || node.type === 'File')) return false;

      if (showAffectedOnly && !node.isChanged && !node.isDownstream) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = node.name.toLowerCase().includes(query);
        const matchesId = node.id.toLowerCase().includes(query);
        const matchesType = node.type.toLowerCase().includes(query);
        if (!matchesName && !matchesId && !matchesType) return false;
      }

      return true;
    });

    const activeNodeIds = new Set(nodes.map(n => n.id));

    let links = enrichedLinks.filter(link => {
      const srcId = typeof link.source === 'object' ? (link.source as SimNode).id : link.source;
      const tgtId = typeof link.target === 'object' ? (link.target as SimNode).id : link.target;
      if (!activeNodeIds.has(srcId) || !activeNodeIds.has(tgtId)) return false;
      if (showRuntimeOnly && !link.isObservedRuntime) return false;
      return true;
    });

    return { filteredNodes: nodes, filteredLinks: links };
  }, [enrichedNodes, enrichedLinks, filterLayer, showAffectedOnly, showRuntimeOnly, searchQuery]);

  // 3. Highlighted Path computation (when hovering or clicking a node)
  const activeFocusId = selectedNode?.id || hoveredNodeId;

  const { highlightedNodeIds, highlightedLinkIds } = useMemo(() => {
    const nIds = new Set<string>();
    const lIds = new Set<string>();

    if (!activeFocusId) {
      return { highlightedNodeIds: nIds, highlightedLinkIds: lIds };
    }

    nIds.add(activeFocusId);

    enrichedLinks.forEach(link => {
      const srcId = typeof link.source === 'object' ? (link.source as SimNode).id : link.source;
      const tgtId = typeof link.target === 'object' ? (link.target as SimNode).id : link.target;

      if (srcId === activeFocusId) {
        nIds.add(tgtId);
        lIds.add(link.id);
      }
      if (tgtId === activeFocusId) {
        nIds.add(srcId);
        lIds.add(link.id);
      }

      if (rootChangedIds.has(srcId) && (tgtId === activeFocusId || directImpactIds.has(srcId))) {
        lIds.add(link.id);
        nIds.add(srcId);
      }
    });

    return { highlightedNodeIds: nIds, highlightedLinkIds: lIds };
  }, [activeFocusId, enrichedLinks, rootChangedIds, directImpactIds]);

  // 4. Default Initial Node Positions (Radial dispersion from center to avoid 0,0 clash)
  const initialPositions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    const count = filteredNodes.length || 1;
    const baseW = 800;
    const baseH = 500;
    const radius = Math.min(baseW, baseH) * 0.35;

    filteredNodes.forEach((node, i) => {
      const cached = cachedPositionsRef.current.get(node.id);
      if (cached && !isNaN(cached.x) && !isNaN(cached.y)) {
        map.set(node.id, cached);
      } else {
        const angle = (i / count) * 2 * Math.PI;
        map.set(node.id, {
          x: baseW / 2 + Math.cos(angle) * radius,
          y: baseH / 2 + Math.sin(angle) * radius
        });
      }
    });

    return map;
  }, [filteredNodes]);

  // 5. Initialize and Manage D3 Force Simulation & Zoom
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    const container = containerRef.current;
    const width = Math.max(container.clientWidth || 800, 320);
    const height = Math.max(container.clientHeight || 500, 320);

    // Build SimNodes with validated initial positions
    const simNodes: SimNode[] = filteredNodes.map((node, i) => {
      const cached = cachedPositionsRef.current.get(node.id);
      const angle = (i / Math.max(filteredNodes.length, 1)) * 2 * Math.PI;
      const r = Math.min(width, height) * 0.32;
      return {
        ...node,
        x: cached && !isNaN(cached.x) ? cached.x : width / 2 + Math.cos(angle) * r,
        y: cached && !isNaN(cached.y) ? cached.y : height / 2 + Math.sin(angle) * r
      };
    });

    const simNodesMap = new Map<string, SimNode>();
    simNodes.forEach(n => simNodesMap.set(n.id, n));

    const simLinks: SimLink[] = filteredLinks.map(link => {
      const srcId = typeof link.source === 'object' ? (link.source as SimNode).id : link.source;
      const tgtId = typeof link.target === 'object' ? (link.target as SimNode).id : link.target;
      return {
        ...link,
        source: srcId,
        target: tgtId
      };
    });

    // Setup D3 Force Simulation
    const simulation = d3.forceSimulation<SimNode>(simNodes)
      .force('link', d3.forceLink<SimNode, SimLink>(simLinks)
        .id(d => d.id)
        .distance(d => {
          if (d.isObservedRuntime) return 140;
          if (d.isDirectPath) return 120;
          return 130;
        })
        .strength(0.7)
      )
      .force('charge', d3.forceManyBody<SimNode>()
        .strength(d => (d.isChanged ? -700 : d.isDirectImpact ? -520 : -380))
        .distanceMax(650)
      )
      .force('center', d3.forceCenter(width / 2, height / 2).strength(0.12))
      .force('collide', d3.forceCollide<SimNode>()
        .radius(d => d.radius + 26)
        .strength(0.9)
      )
      .force('x', d3.forceX(width / 2).strength(0.06))
      .force('y', d3.forceY(height / 2).strength(0.06));

    simulationRef.current = simulation;

    // Zoom & Pan setup
    const zoomGroup = svg.select<SVGGElement>('.d3-zoom-layer');
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.25, 3.5])
      .on('zoom', (event) => {
        zoomGroup.attr('transform', event.transform);
        setZoomScale(event.transform.k);
      });

    zoomBehaviorRef.current = zoomBehavior;
    svg.call(zoomBehavior);

    // Node Drag Behavior
    const dragBehavior = d3.drag<SVGGElement, SimNode>()
      .on('start', (event, d) => {
        if (!event.active && simulationRef.current) {
          simulationRef.current.alphaTarget(0.3).restart();
        }
        if (d) {
          d.fx = d.x;
          d.fy = d.y;
        }
      })
      .on('drag', (event, d) => {
        if (d) {
          d.fx = event.x;
          d.fy = event.y;
        }
      })
      .on('end', (event, d) => {
        if (!event.active && simulationRef.current) {
          simulationRef.current.alphaTarget(0);
        }
        if (d) {
          d.fx = null;
          d.fy = null;
        }
      });

    // Safely bind Drag to each node element via datum
    simNodes.forEach(node => {
      const el = document.getElementById(`d3-node-${node.id}`);
      if (el) {
        d3.select<SVGGElement, SimNode>(el as unknown as SVGGElement)
          .datum(node)
          .call(dragBehavior);
      }
    });

    // Simulation tick handler: safely update DOM attributes with strict null and NaN guards
    simulation.on('tick', () => {
      // 1. Update node coordinates & positions
      simNodes.forEach(node => {
        if (node.x !== undefined && node.y !== undefined && !isNaN(node.x) && !isNaN(node.y)) {
          cachedPositionsRef.current.set(node.id, { x: node.x, y: node.y });
          const el = document.getElementById(`d3-node-${node.id}`);
          if (el) {
            el.setAttribute('transform', `translate(${node.x}, ${node.y})`);
          }
        }
      });

      // 2. Update edge lines and glow paths
      simLinks.forEach(link => {
        const s = typeof link.source === 'object' ? (link.source as SimNode) : simNodesMap.get(link.source as string);
        const t = typeof link.target === 'object' ? (link.target as SimNode) : simNodesMap.get(link.target as string);
        if (!s || !t) return;
        const sx = s.x ?? 0;
        const sy = s.y ?? 0;
        const tx = t.x ?? 0;
        const ty = t.y ?? 0;
        if (isNaN(sx) || isNaN(sy) || isNaN(tx) || isNaN(ty)) return;

        const lineEl = document.getElementById(`d3-edge-${link.id}`);
        if (lineEl) {
          lineEl.setAttribute('x1', String(sx));
          lineEl.setAttribute('y1', String(sy));
          lineEl.setAttribute('x2', String(tx));
          lineEl.setAttribute('y2', String(ty));
        }

        const glowEl = document.getElementById(`d3-glow-${link.id}`);
        if (glowEl) {
          glowEl.setAttribute('x1', String(sx));
          glowEl.setAttribute('y1', String(sy));
          glowEl.setAttribute('x2', String(tx));
          glowEl.setAttribute('y2', String(ty));
        }

        const labelEl = document.getElementById(`d3-label-${link.id}`);
        if (labelEl) {
          labelEl.setAttribute('transform', `translate(${(sx + tx) / 2}, ${(sy + ty) / 2 - 8})`);
        }
      });
    });

    simulation.on('end', () => {
      setIsSimulationActive(false);
    });

    return () => {
      simulation.stop();
    };
  }, [filteredNodes, filteredLinks]);

  // Programmatic Zoom & Navigation controls
  const handleZoomIn = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy, 1.3);
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy, 0.75);
  }, []);

  const handleResetZoom = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(350).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
  }, []);

  const handleFitToScreen = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current || !containerRef.current) return;
    const positions = Array.from(cachedPositionsRef.current.values());
    if (positions.length === 0) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 500;

    const xExtent = d3.extent(positions, d => d.x) as [number, number];
    const yExtent = d3.extent(positions, d => d.y) as [number, number];

    const graphWidth = (xExtent[1] - xExtent[0]) || 400;
    const graphHeight = (yExtent[1] - yExtent[0]) || 300;
    const graphCenterX = (xExtent[0] + xExtent[1]) / 2;
    const graphCenterY = (yExtent[0] + yExtent[1]) / 2;

    const padding = 80;
    const scale = Math.min(
      (width - padding * 2) / Math.max(graphWidth, 100),
      (height - padding * 2) / Math.max(graphHeight, 100),
      1.3
    );

    const transform = d3.zoomIdentity
      .translate(width / 2 - graphCenterX * scale, height / 2 - graphCenterY * scale)
      .scale(scale);

    d3.select(svgRef.current).transition().duration(500).call(zoomBehaviorRef.current.transform, transform);
  }, []);

  const handleFocusRootChange = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current || !containerRef.current) return;
    const rootId = Array.from(rootChangedIds)[0];
    if (!rootId) return;

    const pos = cachedPositionsRef.current.get(rootId);
    if (!pos) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 500;

    const targetNode = enrichedNodes.find(n => n.id === rootId);
    if (targetNode) {
      onSelectNode(targetNode);
    }

    const transform = d3.zoomIdentity
      .translate(width / 2 - pos.x * 1.4, height / 2 - pos.y * 1.4)
      .scale(1.4);

    d3.select(svgRef.current).transition().duration(600).call(zoomBehaviorRef.current.transform, transform);
  }, [rootChangedIds, enrichedNodes, onSelectNode]);

  const handleReheatSimulation = useCallback(() => {
    if (simulationRef.current) {
      setIsSimulationActive(true);
      simulationRef.current.alpha(0.6).restart();
    }
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full bg-[#030712] flex flex-col select-none overflow-hidden scanline-effect min-w-0"
    >
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/3 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Floating Glass Header & Controls Bar */}
      <div className="min-h-12 py-1.5 px-3 sm:px-4 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-2 z-20 shrink-0">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
          {/* Title and Status */}
          <div className="flex items-center gap-2 pr-2.5 sm:pr-3 border-r border-slate-800/80 shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            <span className="text-xs font-semibold tracking-wider text-slate-200 uppercase font-mono flex items-center gap-1.5 whitespace-nowrap">
              D3 Change Impact Graph
            </span>
          </div>

          {/* Layer Filter Buttons */}
          <div className="flex items-center bg-slate-900/90 p-0.5 rounded-lg border border-slate-800 shrink-0">
            {(['ALL', 'SERVICES', 'DATA', 'CODE'] as const).map(layer => {
              const isActive = filterLayer === layer;
              return (
                <button
                  key={layer}
                  onClick={() => setFilterLayer(layer)}
                  className={`px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-[0_2px_10px_rgba(99,102,241,0.35)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  {layer}
                </button>
              );
            })}
          </div>

          <div className="hidden sm:block h-4 w-px bg-slate-800 shrink-0" />

          {/* Downstream Blast Filter Toggles */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setShowAffectedOnly(!showAffectedOnly)}
              className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] border font-medium transition-all whitespace-nowrap ${
                showAffectedOnly 
                  ? 'bg-amber-950/80 border-amber-500/80 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.3)]' 
                  : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Downstream Blast ({impactMetrics.totalImpacted})</span>
            </button>

            <button
              onClick={() => setShowRuntimeOnly(!showRuntimeOnly)}
              className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] border font-medium transition-all whitespace-nowrap ${
                showRuntimeOnly 
                  ? 'bg-indigo-950/80 border-indigo-400/80 text-indigo-200 shadow-[0_0_12px_rgba(99,102,241,0.3)]' 
                  : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Runtime Traces</span>
            </button>
          </div>
        </div>

        {/* Search & D3 Zoom Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative hidden md:block">
            <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search component..."
              className="w-36 lg:w-44 bg-slate-900/90 border border-slate-800/80 rounded-lg pl-7 pr-6 py-1 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-0.5 bg-slate-900/90 border border-slate-800/80 rounded-lg p-0.5 shrink-0">
            <button 
              onClick={handleZoomIn}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 rounded-md transition-colors"
              title="Zoom In (D3)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={handleZoomOut}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 rounded-md transition-colors"
              title="Zoom Out (D3)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={handleResetZoom}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 rounded-md transition-colors text-[10px] font-mono font-medium px-2"
              title="Reset Zoom (100%)"
            >
              {(zoomScale * 100).toFixed(0)}%
            </button>
            <button 
              onClick={handleFitToScreen}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 rounded-md transition-colors"
              title="Fit Graph to View"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={handleReheatSimulation}
              className={`p-1.5 rounded-md transition-colors ${
                isSimulationActive ? 'text-indigo-400 animate-spin' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
              title="Relax D3 Force Layout"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main SVG Interactive Stage */}
      <div className="flex-1 w-full h-full relative overflow-hidden min-w-0">
        {/* Subtle Cybernetic Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, #334155 1px, transparent 1px), linear-gradient(to right, rgba(51, 65, 85, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(51, 65, 85, 0.08) 1px, transparent 1px)`,
            backgroundSize: '28px 28px, 112px 112px, 112px 112px'
          }}
        />

        {/* Floating Quick Jump & Downstream Impact HUD */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 max-w-xs pointer-events-auto">
          <div className="neural-glass-card rounded-xl p-3 border border-slate-800/80 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-800/60">
              <span className="text-[11px] font-bold text-slate-200 tracking-wide flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Downstream Blast Horizon
              </span>
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/60">
                Max {impactMetrics.maxDepth} Hops
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
              <div className="bg-slate-900/70 p-1.5 rounded-lg border border-slate-800/60">
                <div className="text-slate-400 text-[9px] uppercase">Root T₀</div>
                <div className="text-indigo-400 font-bold text-xs mt-0.5">{impactMetrics.rootCount}</div>
              </div>
              <div className="bg-slate-900/70 p-1.5 rounded-lg border border-amber-900/40">
                <div className="text-amber-400 text-[9px] uppercase">Direct</div>
                <div className="text-amber-300 font-bold text-xs mt-0.5">{impactMetrics.directCount}</div>
              </div>
              <div className="bg-slate-900/70 p-1.5 rounded-lg border border-slate-800/60">
                <div className="text-slate-400 text-[9px] uppercase">Indirect</div>
                <div className="text-yellow-400 font-bold text-xs mt-0.5">{impactMetrics.indirectCount}</div>
              </div>
            </div>

            <div className="mt-2.5 flex items-center gap-1.5">
              <button
                onClick={handleFocusRootChange}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-indigo-950/70 hover:bg-indigo-900/80 border border-indigo-700/60 text-indigo-200 rounded-lg text-[10px] font-medium transition-all"
              >
                <Crosshair className="w-3 h-3 text-indigo-400" />
                <span>Focus Root Change</span>
              </button>
              <button
                onClick={handleFitToScreen}
                className="px-2 py-1 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 rounded-lg text-[10px] font-medium transition-all"
                title="Fit full graph"
              >
                <Maximize2 className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Selected Component Inspection Panel (Slide-in HUD) */}
        {selectedNode && (
          <div className="absolute top-3 right-3 z-10 w-72 md:w-80 neural-glass-card rounded-2xl p-4 border border-indigo-500/30 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-800/80">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-900 text-indigo-400 border border-indigo-900/50">
                    {selectedNode.type}
                  </span>
                  <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                    selectedNode.criticality === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border-rose-800' :
                    selectedNode.criticality === 'HIGH' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                    'bg-slate-900 text-slate-300 border-slate-800'
                  }`}>
                    {selectedNode.criticality}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-100 font-mono break-all leading-tight">
                  {selectedNode.name}
                </h4>
              </div>
              <button 
                onClick={() => onSelectNode(null)}
                className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 rounded-md transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Impact Details */}
            <div className="py-2.5 space-y-2 text-xs border-b border-slate-800/80">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Impact Classification:</span>
                <span className={`font-mono text-[11px] font-bold ${
                  selectedNode.isChanged ? 'text-indigo-400' :
                  directImpactIds.has(selectedNode.id) ? 'text-amber-400' :
                  indirectImpactIds.has(selectedNode.id) ? 'text-yellow-400' : 'text-slate-400'
                }`}>
                  {selectedNode.isChanged ? 'T₀ ROOT CAUSE' :
                   directImpactIds.has(selectedNode.id) ? '1-HOP DIRECT IMPACT' :
                   indirectImpactIds.has(selectedNode.id) ? 'INDIRECT DOWNSTREAM' : 'UNAFFECTED'}
                </span>
              </div>

              {enrichedNodes.find(n => n.id === selectedNode.id)?.reason && (
                <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-900/50 text-[11px] text-amber-200/90 leading-relaxed">
                  {enrichedNodes.find(n => n.id === selectedNode.id)?.reason}
                </div>
              )}

              {enrichedNodes.find(n => n.id === selectedNode.id)?.pathFromChange && (
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Propagation Path:</span>
                  <div className="text-[10px] font-mono text-slate-300 bg-slate-900/80 p-1.5 rounded border border-slate-800/60 flex flex-wrap items-center gap-1">
                    {enrichedNodes.find(n => n.id === selectedNode.id)!.pathFromChange!.map((step, idx, arr) => (
                      <React.Fragment key={idx}>
                        <span className={idx === 0 ? 'text-indigo-400 font-bold' : idx === arr.length - 1 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                          {step}
                        </span>
                        {idx < arr.length - 1 && <ArrowRight className="w-2.5 h-2.5 text-slate-600 shrink-0" />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Direct Connectors list */}
            <div className="pt-2 text-[11px]">
              <div className="text-slate-400 text-[10px] uppercase font-mono mb-1.5">Direct Connections:</div>
              <div className="max-h-28 overflow-y-auto space-y-1">
                {enrichedLinks
                  .filter(l => {
                    const s = typeof l.source === 'object' ? (l.source as SimNode).id : l.source;
                    const t = typeof l.target === 'object' ? (l.target as SimNode).id : l.target;
                    return s === selectedNode.id || t === selectedNode.id;
                  })
                  .map(l => {
                    const s = typeof l.source === 'object' ? (l.source as SimNode).id : l.source;
                    const t = typeof l.target === 'object' ? (l.target as SimNode).id : l.target;
                    const otherId = s === selectedNode.id ? t : s;
                    const otherNode = enrichedNodes.find(n => n.id === otherId);
                    const isOutgoing = s === selectedNode.id;

                    return (
                      <button
                        key={l.id}
                        onClick={() => {
                          if (otherNode) onSelectNode(otherNode);
                        }}
                        className="w-full flex items-center justify-between p-1.5 rounded bg-slate-900/60 hover:bg-slate-800 text-[10px] font-mono text-left transition-colors"
                      >
                        <span className="text-slate-300 truncate pr-2">
                          {isOutgoing ? '↳ calls ' : '↲ called by '} {otherNode?.name || otherId}
                        </span>
                        <span className="text-slate-500 text-[9px] uppercase shrink-0">{l.type}</span>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* D3 SVG Canvas */}
        <svg
          ref={svgRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          style={{ width: '100%', height: '100%' }}
        >
          <defs>
            {/* Edge Markers */}
            <marker id="d3-arrow-neutral" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
            </marker>
            <marker id="d3-arrow-runtime" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
            </marker>
            <marker id="d3-arrow-impact" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
            </marker>
            <marker id="d3-arrow-critical" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e" />
            </marker>

            {/* Glowing Drop Shadows for Nodes */}
            <filter id="d3-glow-root" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="d3-glow-impact" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Radial Gradients */}
            <radialGradient id="d3-grad-root-changed" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="55%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#1e1b4b" />
            </radialGradient>

            <radialGradient id="d3-grad-direct-impact" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="55%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#451a03" />
            </radialGradient>

            <radialGradient id="d3-grad-indirect-impact" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="55%" stopColor="#ca8a04" />
              <stop offset="100%" stopColor="#422006" />
            </radialGradient>

            <radialGradient id="d3-grad-critical" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#fda4af" />
              <stop offset="55%" stopColor="#e11d48" />
              <stop offset="100%" stopColor="#4c0519" />
            </radialGradient>

            <radialGradient id="d3-grad-standard" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="60%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>

            <radialGradient id="d3-grad-highlight" cx="30%" cy="30%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* D3 Zoom Layer */}
          <g className="d3-zoom-layer">
            {/* 1. Edges Layer */}
            <g className="edges-layer">
              {filteredLinks.map(link => {
                const isDownstream = link.isDownstreamPath;
                const isRuntime = link.isObservedRuntime;
                const isSelectedFocus = activeFocusId !== null;
                const isPathHighlighted = highlightedLinkIds.has(link.id);

                let strokeColor = '#334155';
                let strokeWidth = 1.6;
                let marker = 'url(#d3-arrow-neutral)';
                let dashClass = '';
                let opacity = 0.8;

                if (isSelectedFocus) {
                  if (isPathHighlighted) {
                    opacity = 1;
                    strokeColor = '#f59e0b';
                    strokeWidth = 2.8;
                    marker = 'url(#d3-arrow-impact)';
                    dashClass = 'animate-edge-flow-fast';
                  } else {
                    opacity = 0.15;
                  }
                } else {
                  if (link.isDirectPath) {
                    strokeColor = '#f59e0b';
                    strokeWidth = 2.4;
                    marker = 'url(#d3-arrow-impact)';
                    dashClass = 'animate-edge-flow';
                  } else if (isDownstream) {
                    strokeColor = '#d97706';
                    strokeWidth = 2.0;
                    marker = 'url(#d3-arrow-impact)';
                    dashClass = 'animate-edge-flow';
                  } else if (isRuntime) {
                    strokeColor = '#38bdf8';
                    strokeWidth = 1.8;
                    marker = 'url(#d3-arrow-runtime)';
                    dashClass = 'animate-edge-flow';
                  }
                }

                // Initial positions for immediate clean render before tick
                const srcId = typeof link.source === 'object' ? (link.source as SimNode).id : link.source;
                const tgtId = typeof link.target === 'object' ? (link.target as SimNode).id : link.target;
                const sPos = cachedPositionsRef.current.get(srcId) || initialPositions.get(srcId) || { x: 400, y: 250 };
                const tPos = cachedPositionsRef.current.get(tgtId) || initialPositions.get(tgtId) || { x: 400, y: 250 };

                return (
                  <g key={link.id} className="transition-opacity duration-300" style={{ opacity }}>
                    {(isDownstream || isPathHighlighted) && (
                      <line
                        id={`d3-glow-${link.id}`}
                        x1={sPos.x}
                        y1={sPos.y}
                        x2={tPos.x}
                        y2={tPos.y}
                        className="graph-edge-glow"
                        stroke={strokeColor}
                        strokeWidth={strokeWidth + 5}
                        strokeOpacity="0.2"
                        strokeLinecap="round"
                      />
                    )}

                    <line
                      id={`d3-edge-${link.id}`}
                      x1={sPos.x}
                      y1={sPos.y}
                      x2={tPos.x}
                      y2={tPos.y}
                      className={`graph-edge-line ${dashClass}`}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray={isRuntime || isDownstream || isPathHighlighted ? '6 4' : undefined}
                      markerEnd={marker}
                    />

                    {isRuntime && link.metadata?.rps && (
                      <g 
                        id={`d3-label-${link.id}`} 
                        className="edge-label-group pointer-events-none"
                        transform={`translate(${(sPos.x + tPos.x) / 2}, ${(sPos.y + tPos.y) / 2 - 8})`}
                      >
                        <rect
                          x="-38"
                          y="-8"
                          width="76"
                          height="16"
                          rx="4"
                          fill="#020617"
                          stroke="#0284c7"
                          strokeWidth="1"
                          fillOpacity="0.92"
                        />
                        <text
                          x="0"
                          y="3.5"
                          fill="#38bdf8"
                          fontSize="8.5"
                          fontFamily="JetBrains Mono, monospace"
                          textAnchor="middle"
                          fontWeight="600"
                        >
                          {link.metadata.rps} rps · {link.metadata.p95_latency_ms}ms
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>

            {/* 2. Nodes Layer */}
            <g className="nodes-layer">
              {filteredNodes.map(node => {
                const isSelected = selectedNode?.id === node.id;
                const isRoot = node.isChanged;
                const isDirect = node.isDirectImpact;
                const isIndirect = node.isIndirectImpact;
                const isCritical = node.criticality === 'CRITICAL';

                const isFocusActive = activeFocusId !== null;
                const isHighlighted = isFocusActive ? highlightedNodeIds.has(node.id) : true;
                const nodeOpacity = isHighlighted ? 1 : 0.22;

                let fillGrad = 'url(#d3-grad-standard)';
                let strokeColor = '#475569';
                let haloColor = 'rgba(71, 85, 105, 0.2)';

                if (isRoot) {
                  fillGrad = 'url(#d3-grad-root-changed)';
                  strokeColor = '#a5b4fc';
                  haloColor = 'rgba(99, 102, 241, 0.45)';
                } else if (isDirect) {
                  fillGrad = 'url(#d3-grad-direct-impact)';
                  strokeColor = '#fde68a';
                  haloColor = 'rgba(245, 158, 11, 0.45)';
                } else if (isIndirect) {
                  fillGrad = 'url(#d3-grad-indirect-impact)';
                  strokeColor = '#fef08a';
                  haloColor = 'rgba(217, 119, 6, 0.35)';
                } else if (isCritical) {
                  fillGrad = 'url(#d3-grad-critical)';
                  strokeColor = '#fda4af';
                  haloColor = 'rgba(244, 63, 94, 0.4)';
                }

                const pos = cachedPositionsRef.current.get(node.id) || initialPositions.get(node.id) || { x: 400, y: 250 };

                return (
                  <g
                    key={node.id}
                    id={`d3-node-${node.id}`}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    className="node-group cursor-pointer group"
                    style={{ opacity: nodeOpacity, transition: 'opacity 0.25s ease' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectNode(isSelected ? null : node);
                    }}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                  >
                    {/* Ambient Pulsing Halo */}
                    <circle
                      r={isRoot ? 38 : isDirect ? 34 : isSelected ? 32 : 26}
                      fill={haloColor}
                      className={isRoot || isDirect || isSelected ? 'animate-pulse' : 'opacity-40'}
                    />

                    {/* Selection Reticle Orbit */}
                    {isSelected && (
                      <>
                        <circle
                          r="33"
                          fill="none"
                          stroke="#818cf8"
                          strokeWidth="1.8"
                          strokeDasharray="4 4"
                          className="animate-radar-spin"
                        />
                        <circle
                          r="41"
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="1"
                          strokeOpacity="0.4"
                        />
                      </>
                    )}

                    {/* 3D Sphere Body */}
                    <circle
                      r={node.radius}
                      fill={fillGrad}
                      stroke={strokeColor}
                      strokeWidth={isRoot || isSelected ? 2.6 : isDirect ? 2.2 : 1.8}
                      filter={isRoot ? 'url(#d3-glow-root)' : (isDirect || isIndirect) ? 'url(#d3-glow-impact)' : undefined}
                      className="transition-transform duration-200 group-hover:scale-110"
                    />

                    {/* Specular Light Highlight */}
                    <ellipse
                      cx="-6"
                      cy="-6"
                      rx="8"
                      ry="4.5"
                      fill="url(#d3-grad-highlight)"
                      className="pointer-events-none"
                    />

                    {/* Domain Icon Glyphs */}
                    <g className="text-white pointer-events-none transform -translate-x-2 -translate-y-2">
                      {node.type === 'Service' && <Server width="16" height="16" stroke="#ffffff" strokeWidth="2.2" />}
                      {node.type === 'Database' && <Database width="16" height="16" stroke="#ffffff" strokeWidth="2.2" />}
                      {node.type === 'Function' && <Terminal width="16" height="16" stroke="#ffffff" strokeWidth="2.2" />}
                      {node.type === 'Queue' && <Radio width="16" height="16" stroke="#ffffff" strokeWidth="2.2" />}
                      {node.type === 'API' && <Activity width="16" height="16" stroke="#ffffff" strokeWidth="2.2" />}
                      {node.type === 'ExternalService' && <Globe width="16" height="16" stroke="#ffffff" strokeWidth="2.2" />}
                      {!['Service', 'Database', 'Function', 'Queue', 'API', 'ExternalService'].includes(node.type) && (
                        <Network width="16" height="16" stroke="#ffffff" strokeWidth="2.2" />
                      )}
                    </g>

                    {/* Node Text Label Badge */}
                    <g transform="translate(0, 32)">
                      <rect
                        x="-65"
                        y="-8.5"
                        width="130"
                        height="17"
                        rx="4"
                        fill="#030712"
                        fillOpacity="0.9"
                        stroke={isRoot ? 'rgba(99, 102, 241, 0.5)' : isDirect ? 'rgba(245, 158, 11, 0.5)' : 'rgba(51, 65, 85, 0.5)'}
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="3.5"
                        textAnchor="middle"
                        fill={isRoot ? '#e0e7ff' : isDirect ? '#fef3c7' : '#cbd5e1'}
                        fontSize="9.5"
                        fontWeight={isRoot || isDirect ? '700' : '600'}
                        fontFamily="Plus Jakarta Sans, sans-serif"
                        className="pointer-events-none tracking-tight"
                      >
                        {node.name.length > 21 ? `${node.name.substring(0, 20)}…` : node.name}
                      </text>
                    </g>

                    {/* Top Impact Pill Badge */}
                    {isRoot && (
                      <g transform="translate(0, -28)">
                        <rect
                          x="-42"
                          y="-8"
                          width="84"
                          height="16"
                          rx="4"
                          fill="#4338ca"
                          stroke="#818cf8"
                          strokeWidth="1.2"
                        />
                        <text
                          x="0"
                          y="3.5"
                          fill="#ffffff"
                          fontSize="8"
                          fontWeight="800"
                          fontFamily="JetBrains Mono, monospace"
                          textAnchor="middle"
                          letterSpacing="0.05em"
                        >
                          T₀ ROOT CAUSE
                        </text>
                      </g>
                    )}

                    {!isRoot && isDirect && (
                      <g transform="translate(0, -28)">
                        <rect
                          x="-40"
                          y="-8"
                          width="80"
                          height="16"
                          rx="4"
                          fill="#b45309"
                          stroke="#f59e0b"
                          strokeWidth="1.2"
                        />
                        <text
                          x="0"
                          y="3.5"
                          fill="#fef3c7"
                          fontSize="8"
                          fontWeight="800"
                          fontFamily="JetBrains Mono, monospace"
                          textAnchor="middle"
                          letterSpacing="0.05em"
                        >
                          1-HOP DIRECT
                        </text>
                      </g>
                    )}

                    {!isRoot && !isDirect && isIndirect && (
                      <g transform="translate(0, -28)">
                        <rect
                          x="-36"
                          y="-7.5"
                          width="72"
                          height="15"
                          rx="4"
                          fill="#78350f"
                          stroke="#d97706"
                          strokeWidth="1"
                        />
                        <text
                          x="0"
                          y="3"
                          fill="#fef3c7"
                          fontSize="7.5"
                          fontWeight="700"
                          fontFamily="JetBrains Mono, monospace"
                          textAnchor="middle"
                          letterSpacing="0.05em"
                        >
                          INDIRECT
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </g>
        </svg>
      </div>

      {/* Hero Bottom Telemetry & Legend Glass Ribbon */}
      <div className="min-h-9 py-1 px-3 sm:px-5 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-slate-400 shrink-0 z-10 overflow-hidden">
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
            <span className="text-[10px] sm:text-[11px] text-slate-300 font-medium">Root Change (T₀)</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
            <span className="text-[10px] sm:text-[11px] text-slate-300 font-medium">Direct 1-Hop Blast</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/90 shadow-[0_0_8px_rgba(234,179,8,0.6)]" />
            <span className="text-[10px] sm:text-[11px] text-slate-300 font-medium">Indirect Downstream</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
            <span className="text-[10px] sm:text-[11px] text-slate-300 font-medium">Critical Tier</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <span className="w-3 border-t-2 border-dashed border-sky-400" />
            <span className="text-[10px] sm:text-[11px] text-slate-300 font-medium">Runtime Trace</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 font-mono text-[10px] sm:text-[11px] text-slate-400 shrink-0">
          <span>Nodes: <strong className="text-slate-200">{filteredNodes.length}</strong></span>
          <span className="text-slate-600">·</span>
          <span>Links: <strong className="text-slate-200">{filteredLinks.length}</strong></span>
          <span className="text-slate-600">·</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            D3 Force Engine
          </span>
        </div>
      </div>
    </div>
  );
};
