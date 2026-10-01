import React, { useRef, useEffect, useState, useMemo } from 'react';
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
  const [hoveredNode] = useState<NodeData | null>(null);

  // Filter edges based on temporal playback slider
  const visibleEdges = useMemo(() => {
    return edges.filter(e => e.ts_epoch <= maxTimestamp);
  }, [edges, maxTimestamp]);

  // Compute active nodes reached by current timestamp
  const activeNodeIds = useMemo(() => {
    const ids = new Set<string>();
    // Victim is always active
    const victim = nodes.find(n => n.hop === 0);
    if (victim) ids.add(victim.acct_no);

    visibleEdges.forEach(e => {
      ids.add(e.src_acct);
      ids.add(e.dst_acct);
    });
    return ids;
  }, [nodes, visibleEdges]);

  // Calculate layout coordinates by layering / hops
  const nodePositions = useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>();
    const hopGroups: Record<number, NodeData[]> = { 0: [], 1: [], 2: [], 3: [], 4: [] };

    nodes.forEach(n => {
      const hop = Math.min(4, n.hop);
      if (!hopGroups[hop]) hopGroups[hop] = [];
      hopGroups[hop].push(n);
    });

    const canvasWidth = 920;
    const canvasHeight = 520;
    const layerWidth = canvasWidth / 5;

    [0, 1, 2, 3, 4].forEach(hop => {
      const group = hopGroups[hop];
      if (!group || group.length === 0) return;
      const x = 70 + hop * layerWidth;
      const stepY = canvasHeight / (group.length + 1);

      group.forEach((node, idx) => {
        positions.set(node.acct_no, {
          x,
          y: stepY * (idx + 1)
        });
      });
    });

    return positions;
  }, [nodes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High-DPI Canvas scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw Subtle Grid
    ctx.strokeStyle = '#F1F5F9';
    ctx.lineWidth = 1;
    for (let x = 0; x < rect.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, rect.height);
      ctx.stroke();
    }
    for (let y = 0; y < rect.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(rect.width, y);
      ctx.stroke();
    }

    // Draw Hop Columns Headers
    const layerLabels = ['VICTIM', 'L1 COLLECTOR', 'L2 DISTRIBUTOR', 'L3 TERMINAL'];
    const layerWidth = rect.width / 5;
    ctx.font = '600 11px Inter, sans-serif';
    ctx.fillStyle = '#94A3B8';
    layerLabels.forEach((label, idx) => {
      const x = 70 + idx * layerWidth;
      ctx.fillText(label, x - 35, 24);
    });

    // 1. Draw Visible Edges
    visibleEdges.forEach(edge => {
      const p1 = nodePositions.get(edge.src_acct);
      const p2 = nodePositions.get(edge.dst_acct);
      if (!p1 || !p2) return;

      const isTainted = edge.taint_paise > 0;
      ctx.beginPath();
      ctx.strokeStyle = isTainted ? '#DC2626' : '#94A3B8';
      ctx.lineWidth = Math.min(5, Math.max(1.5, Math.log10(edge.amount_paise / 1000)));

      // Bezier curve
      const cpX = (p1.x + p2.x) / 2;
      ctx.moveTo(p1.x, p1.y);
      ctx.bezierCurveTo(cpX, p1.y, cpX, p2.y, p2.x, p2.y);
      ctx.stroke();

      // Draw Arrow
      const arrowX = (p1.x + p2.x * 2) / 3;
      const arrowY = (p1.y + p2.y * 2) / 3;
      ctx.fillStyle = isTainted ? '#DC2626' : '#64748B';
      ctx.beginPath();
      ctx.arc(arrowX, arrowY, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // 2. Draw Nodes
    nodes.forEach(node => {
      const pos = nodePositions.get(node.acct_no);
      if (!pos) return;

      const isActive = activeNodeIds.has(node.acct_no);
      const isSelected = selectedNode?.acct_no === node.acct_no;
      const isHovered = hoveredNode?.acct_no === node.acct_no;

      let color = '#2563EB'; // L1
      if (node.hop === 0) color = '#7C3AED'; // Victim
      else if (node.hop === 1) color = '#2563EB'; // L1
      else if (node.hop === 2) color = '#D97706'; // L2
      else color = '#DC2626'; // L3

      // Glow if selected or hovered
      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 24, 0, Math.PI * 2);
        ctx.fillStyle = color + '22';
        ctx.fill();
      }

      // Main Node Circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 16, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? color : '#E2E8F0';
      ctx.fill();
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.strokeStyle = isSelected ? '#0F172A' : '#FFFFFF';
      ctx.stroke();

      // Account Label
      ctx.font = '500 11px Inter, sans-serif';
      ctx.fillStyle = isActive ? '#0F172A' : '#94A3B8';
      ctx.textAlign = 'center';
      ctx.fillText(node.acct_no.slice(0, 8) + '...', pos.x, pos.y + 30);

      // Amount Held Badge (if any)
      if (node.held_paise > 0) {
        const heldInr = `₹${(node.held_paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
        ctx.font = '600 10px JetBrains Mono, monospace';
        ctx.fillStyle = '#15803D';
        ctx.fillText(heldInr, pos.x, pos.y - 20);
      }
    });
  }, [nodes, visibleEdges, activeNodeIds, selectedNode, hoveredNode, nodePositions]);

  // Handle Canvas Clicking on Nodes
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (const node of nodes) {
      const pos = nodePositions.get(node.acct_no);
      if (!pos) continue;
      const dist = Math.hypot(pos.x - x, pos.y - y);
      if (dist <= 20) {
        onSelectNode(node);
        return;
      }
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '520px', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden', background: '#FFFFFF' }}>
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{ width: '100%', height: '100%', display: 'block', cursor: 'pointer' }}
      />
    </div>
  );
};
