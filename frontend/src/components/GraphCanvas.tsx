import React, { useRef, useEffect, useState, useMemo } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Sparkles, Scan, Maximize2, Minimize2 } from 'lucide-react';
import type { NodeData, EdgeData } from '../types';

interface GraphCanvasProps {
  nodes: NodeData[];
  edges: EdgeData[];
  selectedNode: NodeData | null;
  onSelectNode: (node: NodeData) => void;
  maxTimestamp: number;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes,
  edges,
  selectedNode,
  onSelectNode,
  maxTimestamp
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Pan & Zoom state
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<NodeData | null>(null);
  const [animTime, setAnimTime] = useState<number>(0);

  // Animation frame loop for flow particles
  useEffect(() => {
    let animId: number;
    const animate = () => {
      setAnimTime(t => (t + 0.03) % 1.0);
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Filter edges based on temporal playback slider
  const visibleEdges = useMemo(() => {
    return edges.filter(e => e.ts_epoch <= maxTimestamp);
  }, [edges, maxTimestamp]);

  // Compute active nodes reached by current timestamp
  const activeNodeIds = useMemo(() => {
    const ids = new Set<string>();
    const victim = nodes.find(n => n.hop === 0);
    if (victim) ids.add(victim.acct_no);

    visibleEdges.forEach(e => {
      ids.add(e.src_acct);
      ids.add(e.dst_acct);
    });
    return ids;
  }, [nodes, visibleEdges]);

  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // High-density layout calculation with multi-column bands for large node counts
  const { nodePositions, bounds } = useMemo(() => {
    const positions = new Map<string, { x: number; y: number; r: number }>();
    const hopGroups: Record<number, NodeData[]> = { 0: [], 1: [], 2: [], 3: [], 4: [] };

    nodes.forEach(n => {
      const hop = Math.min(4, Math.max(0, n.hop));
      if (!hopGroups[hop]) hopGroups[hop] = [];
      hopGroups[hop].push(n);
    });

    const isLargeGraph = nodes.length > 150;
    const baseWidth = isLargeGraph ? 1300 : 980;
    const baseHeight = isLargeGraph ? 700 : 540;
    const layerSpacing = baseWidth / 4.4;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    [0, 1, 2, 3, 4].forEach(hop => {
      const group = hopGroups[hop];
      if (!group || group.length === 0) return;

      const baseX = 90 + hop * layerSpacing;
      const count = group.length;

      // In dense layers (e.g. 500+ nodes in stress test), distribute into up to 10 sub-columns
      const maxCols = isLargeGraph ? 10 : 6;
      const subCols = Math.max(1, Math.min(maxCols, Math.ceil(count / (isLargeGraph ? 16 : 14))));
      const colWidth = subCols > 1 ? (isLargeGraph ? 42 : 50) : 0;
      const itemsPerCol = Math.ceil(count / subCols);
      const rowSpacing = Math.max(isLargeGraph ? 20 : 26, Math.min(65, (baseHeight - 80) / Math.max(itemsPerCol, 1)));

      group.forEach((node, idx) => {
        const colIdx = idx % subCols;
        const rowIdx = Math.floor(idx / subCols);
        const x = baseX + (colIdx - (subCols - 1) / 2) * colWidth;
        const y = 65 + (rowIdx + 0.5) * rowSpacing + ((colIdx % 2) * (rowSpacing * 0.25));

        // Node radius dynamically sized by held amount or volume
        let r = isLargeGraph ? 9 : 12;
        if (hop === 0) r = isLargeGraph ? 15 : 18; // Victim
        else if (node.held_paise > 10000000) r = isLargeGraph ? 14 : 18; // > ₹1 Lakh
        else if (node.held_paise > 1000000) r = isLargeGraph ? 12 : 15; // > ₹10,000
        else r = isLargeGraph ? 8.5 : 11;

        positions.set(node.acct_no, { x, y, r });

        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      });
    });

    return {
      nodePositions: positions,
      bounds: {
        minX: isFinite(minX) ? minX : 0,
        maxX: isFinite(maxX) ? maxX : 1000,
        minY: isFinite(minY) ? minY : 0,
        maxY: isFinite(maxY) ? maxY : 600
      }
    };
  }, [nodes]);

  // Auto-fit function to center and frame all nodes
  const fitToView = () => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const graphWidth = (bounds.maxX - bounds.minX) + 120;
    const graphHeight = (bounds.maxY - bounds.minY) + 120;

    const scaleX = rect.width / graphWidth;
    const scaleY = rect.height / graphHeight;
    const fitZoom = Math.max(0.2, Math.min(1.2, Math.min(scaleX, scaleY) * 0.92));

    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    setZoom(fitZoom);
    setPan({
      x: rect.width / 2 - centerX * fitZoom,
      y: rect.height / 2 - centerY * fitZoom
    });
  };

  // Auto-fit on dataset/nodes change
  useEffect(() => {
    if (nodes.length > 0) {
      // Short delay to ensure canvas rect is ready
      const timer = setTimeout(fitToView, 50);
      return () => clearTimeout(timer);
    }
  }, [nodes.length]);

  // Canvas redraw on animation, pan, zoom, nodes, edges
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.save();
    // Apply Pan & Zoom Transform
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // 1. Draw Background Grid
    ctx.strokeStyle = '#F1F5F9';
    ctx.lineWidth = 1 / zoom;
    const gridMinX = -pan.x / zoom - 200;
    const gridMaxX = (rect.width - pan.x) / zoom + 200;
    const gridMinY = -pan.y / zoom - 200;
    const gridMaxY = (rect.height - pan.y) / zoom + 200;

    for (let x = Math.floor(gridMinX / 50) * 50; x < gridMaxX; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, gridMinY);
      ctx.lineTo(x, gridMaxY);
      ctx.stroke();
    }
    for (let y = Math.floor(gridMinY / 50) * 50; y < gridMaxY; y += 50) {
      ctx.beginPath();
      ctx.moveTo(gridMinX, y);
      ctx.lineTo(gridMaxX, y);
      ctx.stroke();
    }

    // 2. Draw Layer Column Headers
    const layerTitles = [
      'VICTIM COMPLAINT',
      'L1 INITIAL RECEIVER',
      'L2 MONEY SPLITTER',
      'L3 MULE DISTRIBUTOR',
      'L4 CASH-OUT / DESTINATION'
    ];
    const isLargeGraph = nodes.length > 150;
    const baseWidth = isLargeGraph ? 1300 : 980;
    const layerSpacing = baseWidth / 4.4;
    ctx.font = '700 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#94A3B8';
    layerTitles.forEach((title, idx) => {
      const lx = 90 + idx * layerSpacing;
      ctx.fillText(title, lx, 30);
    });

    // 3. Batch Draw Edges
    const isDenseGraph = visibleEdges.length > 300;

    visibleEdges.forEach((edge, edgeIdx) => {
      const p1 = nodePositions.get(edge.src_acct);
      const p2 = nodePositions.get(edge.dst_acct);
      if (!p1 || !p2) return;

      const isTainted = edge.taint_paise > 0;
      ctx.beginPath();
      ctx.strokeStyle = isTainted ? '#DC2626' : '#CBD5E1';
      ctx.lineWidth = Math.min(5, Math.max(1.2, Math.log10(Math.max(10, edge.amount_paise / 1000)))) / Math.sqrt(zoom);

      // Smooth Cubic Bezier Curve
      const cpX = (p1.x + p2.x) / 2;
      ctx.moveTo(p1.x, p1.y);
      ctx.bezierCurveTo(cpX, p1.y, cpX, p2.y, p2.x, p2.y);
      ctx.stroke();

      // Flow particle pulse along the bezier curve
      // For dense graphs (>300 edges), throttle particle density to keep 60 FPS
      const showParticle = isTainted && (!isDenseGraph || edgeIdx % 3 === 0 || edge.taint_paise > 5000000);
      if (showParticle) {
        const t = (animTime + ((edgeIdx * 17) % 100) / 100) % 1.0;
        const u = 1 - t;
        const tt = t * t;
        const uu = u * u;
        const px = uu * u * p1.x + 3 * uu * t * cpX + 3 * u * tt * cpX + tt * t * p2.x;
        const py = uu * u * p1.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + tt * t * p2.y;

        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.arc(px, py, (isLargeGraph ? 2.5 : 3.5) / Math.sqrt(zoom), 0, Math.PI * 2);
        ctx.fill();
      }

      // Directional arrow head
      const arrowT = 0.65;
      const u = 1 - arrowT;
      const ax = u * u * u * p1.x + 3 * u * u * arrowT * cpX + 3 * u * arrowT * arrowT * cpX + arrowT * arrowT * arrowT * p2.x;
      const ay = u * u * u * p1.y + 3 * u * u * arrowT * p1.y + 3 * u * arrowT * arrowT * p2.y + arrowT * arrowT * arrowT * p2.y;

      ctx.fillStyle = isTainted ? '#DC2626' : '#64748B';
      ctx.beginPath();
      ctx.arc(ax, ay, 2.5 / Math.sqrt(zoom), 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Draw Nodes with Level-of-Detail (LOD)
    const isDense = nodes.length > 150;
    const showText = zoom >= 0.55 || !isDense;

    nodes.forEach(node => {
      const pos = nodePositions.get(node.acct_no);
      if (!pos) return;

      // Viewport culling for 500+ nodes
      const screenX = pos.x * zoom + pan.x;
      const screenY = pos.y * zoom + pan.y;
      if (screenX < -60 || screenX > rect.width + 60 || screenY < -60 || screenY > rect.height + 60) {
        return; // Skip rendering out-of-screen nodes
      }

      const isActive = activeNodeIds.has(node.acct_no);
      const isSelected = selectedNode?.acct_no === node.acct_no;
      const isHovered = hoveredNode?.acct_no === node.acct_no;

      let baseColor = '#2563EB'; // L1
      if (node.hop === 0) baseColor = '#7C3AED'; // Victim
      else if (node.hop === 1) baseColor = '#2563EB'; // L1
      else if (node.hop === 2) baseColor = '#D97706'; // L2
      else baseColor = '#DC2626'; // L3

      // Halo on select/hover
      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, pos.r + 8, 0, Math.PI * 2);
        ctx.fillStyle = baseColor + '33';
        ctx.fill();
      }

      // Outer Risk Border
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, pos.r + 2, 0, Math.PI * 2);
      ctx.strokeStyle = node.held_paise > 0 ? '#16A34A' : '#CBD5E1';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Main Node Circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, pos.r, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? baseColor : '#E2E8F0';
      ctx.fill();
      ctx.lineWidth = isSelected ? 3 : 1.5;
      ctx.strokeStyle = isSelected ? '#0F172A' : '#FFFFFF';
      ctx.stroke();

      // Bank Initial in Node
      if (pos.r >= 12) {
        ctx.font = `700 ${Math.max(8, pos.r * 0.6)}px Inter, sans-serif`;
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.bank.slice(0, 2), pos.x, pos.y);
      }

      // Text Labels (Subject to LOD)
      if (showText || isHovered || isSelected) {
        ctx.textBaseline = 'alphabetic';
        ctx.font = '600 10px Inter, sans-serif';
        ctx.fillStyle = isActive ? '#0F172A' : '#94A3B8';
        ctx.textAlign = 'center';
        ctx.fillText(node.acct_no.slice(0, 8), pos.x, pos.y + pos.r + 13);

        // Recoverable Stolen Funds Badge
        if (node.held_paise > 0) {
          const heldInr = `₹${(node.held_paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
          ctx.font = '700 9px JetBrains Mono, monospace';
          ctx.fillStyle = '#16A34A';
          ctx.fillText(heldInr, pos.x, pos.y - pos.r - 5);
        }
      }
    });

    ctx.restore();
  }, [nodes, visibleEdges, activeNodeIds, selectedNode, hoveredNode, nodePositions, pan, zoom, animTime]);

  // Pan Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
      return;
    }

    // Hover detection in transformed space
    const mouseX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseY = (e.clientY - rect.top - pan.y) / zoom;

    let found: NodeData | null = null;
    for (const node of nodes) {
      const pos = nodePositions.get(node.acct_no);
      if (!pos) continue;
      const dist = Math.hypot(pos.x - mouseX, pos.y - mouseY);
      if (dist <= pos.r + 4) {
        found = node;
        break;
      }
    }
    setHoveredNode(found);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom on wheel towards cursor
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newZoom = Math.max(0.2, Math.min(5.0, zoom * zoomFactor));

    setPan({
      x: mouseX - (mouseX - pan.x) * (newZoom / zoom),
      y: mouseY - (mouseY - pan.y) * (newZoom / zoom)
    });
    setZoom(newZoom);
  };

  // Node Click Selection
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left - pan.x) / zoom;
    const clickY = (e.clientY - rect.top - pan.y) / zoom;

    for (const node of nodes) {
      const pos = nodePositions.get(node.acct_no);
      if (!pos) continue;
      const dist = Math.hypot(pos.x - clickX, pos.y - clickY);
      if (dist <= pos.r + 4) {
        onSelectNode(node);
        return;
      }
    }
  };

  const handleZoomIn = () => setZoom(z => Math.min(5.0, z * 1.25));
  const handleZoomOut = () => setZoom(z => Math.max(0.2, z / 1.25));
  const handleReset = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: isExpanded ? '780px' : '560px',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        background: '#FFFFFF',
        userSelect: 'none',
        transition: 'height 0.25s ease'
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleClick}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: isDragging ? 'grabbing' : hoveredNode ? 'pointer' : 'grab'
        }}
      />

      {/* Floating Controls Overlay */}
      <div style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '6px 10px',
        borderRadius: '8px',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border)',
        backdropFilter: 'blur(4px)'
      }}>
        <button
          onClick={fitToView}
          title="Fit All Nodes in View"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '5px 8px',
            borderRadius: '4px',
            border: '1px solid var(--border)',
            backgroundColor: '#FFFFFF',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--text)'
          }}
        >
          <Scan size={14} color="var(--primary)" />
          <span>Fit View</span>
        </button>

        <button
          onClick={handleZoomIn}
          title="Zoom In"
          style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: '#FFFFFF' }}
        >
          <ZoomIn size={14} color="var(--text)" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: '#FFFFFF' }}
        >
          <ZoomOut size={14} color="var(--text)" />
        </button>
        <button
          onClick={handleReset}
          title="Reset to 100%"
          style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: '#FFFFFF' }}
        >
          <RotateCcw size={14} color="var(--text)" />
        </button>

        <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--border)', margin: '0 4px' }} />

        <button
          onClick={() => {
            setIsExpanded(!isExpanded);
            setTimeout(fitToView, 100);
          }}
          title={isExpanded ? "Collapse Canvas" : "Expand Full View (780px)"}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '5px 8px',
            borderRadius: '4px',
            border: '1px solid var(--border)',
            backgroundColor: isExpanded ? 'var(--primary-light)' : '#FFFFFF',
            fontSize: '11px',
            fontWeight: 600,
            color: isExpanded ? 'var(--primary)' : 'var(--text)'
          }}
        >
          {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
        </button>

        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '4px' }}>
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* Scale & FPS Badge */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        padding: '6px 12px',
        borderRadius: '20px',
        border: '1px solid var(--border)',
        fontSize: '11px',
        color: 'var(--text-muted)'
      }}>
        <Sparkles size={13} color="var(--primary)" />
        <span>Rendering: <strong>{nodes.length} Accounts</strong> · <strong>{visibleEdges.length} Flows</strong> (60 FPS Hardware-Accelerated)</span>
        <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>• Drag to pan · Scroll to zoom</span>
      </div>

      {/* Hover Info Tooltip */}
      {hoveredNode && (
        <div style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          padding: '10px 14px',
          borderRadius: '8px',
          fontSize: '11px',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          pointerEvents: 'none'
        }}>
          <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{hoveredNode.acct_no}</div>
          <div style={{ color: '#94A3B8' }}>{hoveredNode.bank} · Hop {hoveredNode.hop} ({hoveredNode.layer})</div>
          {hoveredNode.held_paise > 0 && (
            <div style={{ color: '#4ADE80', fontWeight: 700 }}>
              Recoverable Funds: ₹{(hoveredNode.held_paise / 100).toLocaleString('en-IN')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
