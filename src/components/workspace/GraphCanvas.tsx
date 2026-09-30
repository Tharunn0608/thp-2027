import React, { useState } from 'react';
import { 
  Network, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Filter, 
  Activity, 
  Server, 
  Database, 
  Radio, 
  Terminal,
  ShieldAlert,
  Flame,
  Globe,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { SoftwareGraph, GraphNode, GraphEdge } from '../../types.ts';

interface GraphCanvasProps {
  graph: SoftwareGraph;
  onSelectNode: (node: GraphNode | null) => void;
  selectedNode: GraphNode | null;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({ graph, onSelectNode, selectedNode }) => {
  const [filterLayer, setFilterLayer] = useState<string>('ALL');
  const [showRuntimeOnly, setShowRuntimeOnly] = useState<boolean>(false);
  const [showAffectedOnly, setShowAffectedOnly] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Dynamic topological layout algorithm that works for ANY repository
  const getNodeCoordinates = (nodeId: string, index: number, total: number) => {
    // Known curated positions for crisp rendering
    const customPositions: Record<string, { x: number; y: number }> = {
      // E-Commerce
      'srv-gateway': { x: 90, y: 180 },
      'api-checkout': { x: 230, y: 180 },
      'srv-order': { x: 390, y: 180 },
      'fn-order-calc': { x: 390, y: 290 },
      'db-order': { x: 390, y: 70 },
      'srv-payment': { x: 570, y: 290 },
      'fn-calc-total': { x: 570, y: 390 },
      'db-payment': { x: 750, y: 390 },
      'ext-stripe': { x: 750, y: 260 },
      'queue-events': { x: 570, y: 80 },
      'srv-notification': { x: 750, y: 80 },
      'srv-inventory': { x: 390, y: 390 },
      'db-inventory': { x: 230, y: 390 },
      // College Management System
      'col-gw': { x: 90, y: 190 },
      'col-api-enroll': { x: 240, y: 190 },
      'col-srv-student': { x: 410, y: 190 },
      'col-fn-enroll': { x: 410, y: 310 },
      'col-db-course': { x: 410, y: 70 },
      'col-srv-fees': { x: 590, y: 310 },
      'col-fn-dues': { x: 750, y: 350 },
      'col-queue-alerts': { x: 590, y: 190 },
      'col-srv-notify': { x: 750, y: 190 },
      'col-ext-sis': { x: 590, y: 70 },
      'col-db-audit': { x: 240, y: 330 },
      'col-srv-exam': { x: 750, y: 70 },
      // Banking Core & Wire Ledger
      'bnk-gw': { x: 90, y: 190 },
      'bnk-api-wire': { x: 240, y: 190 },
      'bnk-srv-auth': { x: 240, y: 70 },
      'bnk-srv-wire': { x: 420, y: 190 },
      'bnk-fn-validate': { x: 420, y: 310 },
      'bnk-srv-ledger': { x: 610, y: 310 },
      'bnk-fn-post': { x: 760, y: 350 },
      'bnk-db-ledger': { x: 610, y: 190 },
      'bnk-srv-fraud': { x: 610, y: 70 },
      'bnk-queue-audit': { x: 420, y: 70 },
      'bnk-ext-swift': { x: 760, y: 190 },
      'bnk-ext-sanctions': { x: 760, y: 70 },
    };

    if (customPositions[nodeId]) {
      return customPositions[nodeId];
    }
    // Dynamic layered or circular layout for arbitrary repositories
    const angle = (index / Math.max(total, 1)) * 2 * Math.PI;
    return {
      x: 420 + Math.cos(angle) * 270,
      y: 220 + Math.sin(angle) * 150
    };
  };

  // Find root changed node and build downstream blast radius dynamically
  const changedNodes = new Set(graph.nodes.filter(n => n.isChanged).map(n => n.id));
  const downstreamImpacted = new Set<string>();

  // Add 1-hop and 2-hop downstream neighbors
  graph.edges.forEach(e => {
    if (changedNodes.has(e.source)) {
      downstreamImpacted.add(e.target);
    }
  });
  graph.edges.forEach(e => {
    if (downstreamImpacted.has(e.source)) {
      downstreamImpacted.add(e.target);
    }
  });

  const isAffected = (node: GraphNode) => {
    return node.isChanged || downstreamImpacted.has(node.id) || node.criticality === 'CRITICAL';
  };

  const filteredNodes = graph.nodes.filter(node => {
    if (showAffectedOnly && !isAffected(node)) return false;
    if (filterLayer === 'ALL') return true;
    if (filterLayer === 'SERVICES' && (node.type === 'Service' || node.type === 'API')) return true;
    if (filterLayer === 'DATA' && (node.type === 'Database' || node.type === 'Queue')) return true;
    if (filterLayer === 'CODE' && (node.type === 'Function' || node.type === 'File')) return true;
    return true;
  });

  const nodeMap = new Map(graph.nodes.map((n, i) => [n.id, { ...n, ...getNodeCoordinates(n.id, i, graph.nodes.length) }]));

  const filteredEdges = graph.edges.filter(edge => {
    if (showRuntimeOnly && edge.sourceType !== 'runtime') return false;
    const src = nodeMap.get(edge.source);
    const tgt = nodeMap.get(edge.target);
    if (!src || !tgt) return false;
    if (showAffectedOnly && (!isAffected(src) || !isAffected(tgt))) return false;
    return true;
  });

  // Calculate connected edges for highlighting active node interactions
  const isEdgeConnectedToSelected = (edge: GraphEdge) => {
    if (!selectedNode && !hoveredNodeId) return false;
    const focusId = selectedNode?.id || hoveredNodeId;
    return edge.source === focusId || edge.target === focusId;
  };

  return (
    <div className="relative w-full h-full bg-[#030712] flex flex-col select-none overflow-hidden scanline-effect">
      {/* Dynamic Ambient Background Glows for Subtle Depth */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/3 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Floating Glass Controls Bar */}
      <div className="min-h-12 py-1.5 px-3 sm:px-4 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md flex flex-wrap items-center justify-between gap-2 z-20 shrink-0">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-2 pr-2.5 sm:pr-3 border-r border-slate-800/80 shrink-0">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            <span className="text-xs font-semibold tracking-wider text-slate-200 uppercase font-mono flex items-center gap-1.5 whitespace-nowrap">
              Change-Risk Graph
            </span>
          </div>

          {/* Layer Filter Buttons */}
          <div className="flex items-center bg-slate-900/80 p-0.5 rounded-lg border border-slate-800 shrink-0">
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

          {/* Filter Toggles */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setShowRuntimeOnly(!showRuntimeOnly)}
              className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] border font-medium transition-all whitespace-nowrap ${
                showRuntimeOnly 
                  ? 'bg-indigo-950/80 border-indigo-400/80 text-indigo-200 shadow-[0_0_12px_rgba(99,102,241,0.3)]' 
                  : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Runtime Traces</span>
            </button>

            <button
              onClick={() => setShowAffectedOnly(!showAffectedOnly)}
              className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] border font-medium transition-all whitespace-nowrap ${
                showAffectedOnly 
                  ? 'bg-amber-950/80 border-amber-500/80 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.3)]' 
                  : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Affected Subgraph</span>
            </button>
          </div>
        </div>

        {/* Zoom & Viewport Controls */}
        <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-800/80 rounded-lg p-0.5 shrink-0">
          <button 
            onClick={() => setZoomLevel(prev => Math.min(prev + 0.15, 1.8))}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 rounded-md transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => setZoomLevel(prev => Math.max(prev - 0.15, 0.6))}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 rounded-md transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => setZoomLevel(1)}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 rounded-md transition-colors text-[10px] font-mono font-medium px-2"
            title="Reset Zoom"
          >
            {(zoomLevel * 100).toFixed(0)}%
          </button>
          <button 
            onClick={() => setZoomLevel(1)}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 rounded-md transition-colors"
            title="Fit to Screen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SVG Canvas Main Stage */}
      <div className="flex-1 w-full h-full relative overflow-hidden flex items-center justify-center">
        {/* Subtle Cybernetic Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, #334155 1px, transparent 1px), linear-gradient(to right, rgba(51, 65, 85, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(51, 65, 85, 0.08) 1px, transparent 1px)`,
            backgroundSize: '28px 28px, 112px 112px, 112px 112px'
          }}
        />

        <svg 
          viewBox="0 0 860 460" 
          className="w-full h-full max-h-[580px] transition-transform duration-300 ease-out"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <defs>
            {/* Edge Markers */}
            <marker id="arrow-neutral" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
            </marker>
            <marker id="arrow-runtime" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
            </marker>
            <marker id="arrow-impact" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
            </marker>
            <marker id="arrow-critical" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e" />
            </marker>

            {/* Glowing Drop Shadows for Nodes */}
            <filter id="glow-root" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="glow-impact" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Linear & Radial Gradients for 3D Nodes */}
            <radialGradient id="grad-root-changed" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="60%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#1e1b4b" />
            </radialGradient>

            <radialGradient id="grad-impacted" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="60%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#451a03" />
            </radialGradient>

            <radialGradient id="grad-critical" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="60%" stopColor="#e11d48" />
              <stop offset="100%" stopColor="#4c0519" />
            </radialGradient>

            <radialGradient id="grad-standard" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="60%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>

            <radialGradient id="grad-highlight" cx="30%" cy="30%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Render Graph Edges */}
          {filteredEdges.map(edge => {
            const src = nodeMap.get(edge.source);
            const tgt = nodeMap.get(edge.target);
            if (!src || !tgt) return null;

            const isRuntime = edge.sourceType === 'runtime';
            const isRootSource = changedNodes.has(edge.source);
            const isHighImpact = isRootSource || downstreamImpacted.has(edge.target);
            const isCritical = tgt.criticality === 'CRITICAL' || src.criticality === 'CRITICAL';
            const isConnected = isEdgeConnectedToSelected(edge);

            let strokeColor = '#334155';
            let strokeWidth = 1.6;
            let marker = 'url(#arrow-neutral)';
            let dashClass = '';

            if (isCritical && isHighImpact) {
              strokeColor = '#f43f5e';
              strokeWidth = 2.4;
              marker = 'url(#arrow-critical)';
              dashClass = 'animate-edge-flow-fast';
            } else if (isHighImpact) {
              strokeColor = '#f59e0b';
              strokeWidth = 2.2;
              marker = 'url(#arrow-impact)';
              dashClass = 'animate-edge-flow';
            } else if (isRuntime) {
              strokeColor = '#38bdf8';
              strokeWidth = 1.8;
              marker = 'url(#arrow-runtime)';
              dashClass = 'animate-edge-flow';
            }

            if (isConnected) {
              strokeWidth += 1.2;
            }

            return (
              <g key={edge.id} className="transition-opacity duration-300">
                {/* Outer Glow Halo Line for Impact Paths */}
                {isHighImpact && (
                  <line
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth + 5}
                    strokeOpacity="0.15"
                    strokeLinecap="round"
                  />
                )}

                {/* Primary Edge Line */}
                <line
                  x1={src.x}
                  y1={src.y}
                  x2={tgt.x}
                  y2={tgt.y}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={isRuntime || isHighImpact ? '6 4' : undefined}
                  markerEnd={marker}
                  className={`transition-all duration-300 ${dashClass}`}
                />

                {/* Runtime Telemetry Metric Pill */}
                {isRuntime && edge.metadata?.rps && (
                  <g transform={`translate(${(src.x + tgt.x) / 2}, ${(src.y + tgt.y) / 2 - 10})`}>
                    <rect
                      x="-42"
                      y="-8"
                      width="84"
                      height="16"
                      rx="8"
                      fill="#020617"
                      stroke="#0284c7"
                      strokeWidth="1"
                      fillOpacity="0.9"
                    />
                    <text
                      x="0"
                      y="3.5"
                      fill="#38bdf8"
                      fontSize="9"
                      fontFamily="JetBrains Mono, monospace"
                      textAnchor="middle"
                      fontWeight="600"
                    >
                      {edge.metadata.rps} rps · {edge.metadata.p95_latency_ms}ms
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Render Graph Nodes */}
          {filteredNodes.map(node => {
            const pos = nodeMap.get(node.id);
            if (!pos) return null;

            const isSelected = selectedNode?.id === node.id;
            const isHovered = hoveredNodeId === node.id;
            const isRootChange = node.isChanged;
            const isDownstream = downstreamImpacted.has(node.id);
            const isCritical = node.criticality === 'CRITICAL';

            let fillGrad = 'url(#grad-standard)';
            let strokeColor = '#475569';
            let haloColor = 'rgba(71, 85, 105, 0.2)';

            if (isRootChange) {
              fillGrad = 'url(#grad-root-changed)';
              strokeColor = '#a5b4fc';
              haloColor = 'rgba(99, 102, 241, 0.45)';
            } else if (isCritical) {
              fillGrad = 'url(#grad-critical)';
              strokeColor = '#fda4af';
              haloColor = 'rgba(244, 63, 94, 0.4)';
            } else if (isDownstream) {
              fillGrad = 'url(#grad-impacted)';
              strokeColor = '#fde68a';
              haloColor = 'rgba(245, 158, 11, 0.4)';
            }

            return (
              <g 
                key={node.id} 
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => onSelectNode(isSelected ? null : node)}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                className="cursor-pointer group"
              >
                {/* 1. Pulsing Ambient Halo */}
                <circle 
                  r={isRootChange ? '36' : isSelected ? '34' : '28'} 
                  fill={haloColor}
                  className={isRootChange || isSelected ? 'animate-pulse' : 'opacity-40'}
                />

                {/* 2. Selection / Target Lock Reticle */}
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
                      r="40" 
                      fill="none" 
                      stroke="#38bdf8" 
                      strokeWidth="1" 
                      strokeOpacity="0.4"
                    />
                  </>
                )}

                {/* 3. Main 3D Node Sphere Body */}
                <circle
                  r="21"
                  fill={fillGrad}
                  stroke={strokeColor}
                  strokeWidth={isRootChange || isSelected ? '2.5' : '1.8'}
                  className="transition-transform duration-200 group-hover:scale-110 shadow-xl"
                  filter={isRootChange ? 'url(#glow-root)' : isDownstream ? 'url(#glow-impact)' : undefined}
                />

                {/* 4. Specular 3D Glass Light Highlight */}
                <ellipse
                  cx="-6"
                  cy="-7"
                  rx="9"
                  ry="5"
                  fill="url(#grad-highlight)"
                  className="pointer-events-none"
                />

                {/* 5. Center Domain Icon Glyph */}
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

                {/* 6. Crisp Text Label with Glass Badge Backdrop */}
                <g transform="translate(0, 34)">
                  <rect
                    x="-65"
                    y="-9"
                    width="130"
                    height="18"
                    rx="9"
                    fill="#030712"
                    fillOpacity="0.85"
                    stroke={isRootChange ? 'rgba(99, 102, 241, 0.4)' : 'rgba(51, 65, 85, 0.5)'}
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    fill={isRootChange ? '#e0e7ff' : '#cbd5e1'}
                    fontSize="10"
                    fontWeight={isRootChange ? '700' : '600'}
                    fontFamily="Plus Jakarta Sans, sans-serif"
                    className="pointer-events-none tracking-tight"
                  >
                    {node.name.length > 20 ? `${node.name.substring(0, 19)}…` : node.name}
                  </text>
                </g>

                {/* 7. Top Status Badges */}
                {isRootChange && (
                  <g transform="translate(0, -28)">
                    <rect
                      x="-38"
                      y="-8"
                      width="76"
                      height="17"
                      rx="8.5"
                      fill="#4f46e5"
                      stroke="#818cf8"
                      strokeWidth="1.2"
                    />
                    <text
                      x="0"
                      y="3.5"
                      fill="#ffffff"
                      fontSize="8.5"
                      fontWeight="800"
                      fontFamily="JetBrains Mono, monospace"
                      textAnchor="middle"
                      letterSpacing="0.05em"
                    >
                      CHANGED T₀
                    </text>
                  </g>
                )}

                {!isRootChange && isDownstream && (
                  <g transform="translate(0, -28)">
                    <rect
                      x="-34"
                      y="-8"
                      width="68"
                      height="16"
                      rx="8"
                      fill="#b45309"
                      stroke="#f59e0b"
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="3"
                      fill="#fef3c7"
                      fontSize="8"
                      fontWeight="700"
                      fontFamily="JetBrains Mono, monospace"
                      textAnchor="middle"
                      letterSpacing="0.05em"
                    >
                      IMPACTED
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Hero Bottom Telemetry & Legend Glass Ribbon */}
      <div className="min-h-9 py-1 px-3 sm:px-5 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-slate-400 shrink-0 z-10 overflow-hidden">
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
            <span className="text-[10px] sm:text-[11px] text-slate-300 font-medium">Root Change (T₀)</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
            <span className="text-[10px] sm:text-[11px] text-slate-300 font-medium">Blast Reach</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
            <span className="text-[10px] sm:text-[11px] text-slate-300 font-medium">Critical Tier</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <span className="w-3 border-t-2 border-dashed border-sky-400" />
            <span className="text-[10px] sm:text-[11px] text-slate-300 font-medium">Live Telemetry Flow</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 font-mono text-[10px] sm:text-[11px] text-slate-400 shrink-0">
          <span>Active Nodes: <strong className="text-slate-200">{filteredNodes.length}</strong></span>
          <span className="text-slate-600">·</span>
          <span>Edges: <strong className="text-slate-200">{filteredEdges.length}</strong></span>
          <span className="text-slate-600">·</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            Live Sync
          </span>
        </div>
      </div>
    </div>
  );
};
