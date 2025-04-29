import React, { useRef, useEffect, useState, useCallback } from 'react';
import ForceGraph2D, { ForceGraphMethods, NodeObject, LinkObject } from 'react-force-graph-2d';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import apiClient from '../../services/apiClient';

interface FlowNode extends NodeObject {
  id: string;
  name: string;
  value: number; // Represents visit count or importance
}

interface FlowLink extends LinkObject {
  source: string;
  target: string;
  value: number; // Represents transition count
}

interface UserFlowData {
  nodes: FlowNode[];
  links: FlowLink[];
}

const UserFlowDiagram: React.FC = () => {
  const fgRef = useRef<ForceGraphMethods>();
  const [graphData, setGraphData] = useState<UserFlowData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Function to fetch data
  const loadUserFlowData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<UserFlowData>('/admin/analytics/user-flow-diagram');
      // Ensure nodes have x, y, vx, vy initialized if needed by the library
      const nodes = response.data.nodes.map(node => ({ ...node }));
      const links = response.data.links.map(link => ({ ...link }));
      setGraphData({ nodes, links });
    } catch (err) {
      console.error('Error fetching user flow data:', err);
      setError('Failed to load user flow data. Please try again later.');
      setGraphData({ nodes: [], links: [] }); // Clear data on error
    }
    setLoading(false);
  };

  // Load data on mount
  useEffect(() => {
    loadUserFlowData();
  }, []);

  // Handle resizing
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateDimensions(); // Initial dimensions
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Center graph on data load
  useEffect(() => {
    if (graphData.nodes.length > 0 && fgRef.current) {
      fgRef.current.zoomToFit(400, 100); // Zoom to fit with padding
    }
  }, [graphData]);

  // Node styling and rendering
  const nodeCanvasObject = useCallback((node: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const flowNode = node as FlowNode;
    const label = flowNode.name;
    const fontSize = 12 / globalScale;
    const nodeRadius = Math.max(3, Math.min(15, Math.sqrt(flowNode.value || 1) / 5)); // Scale radius based on value

    // Draw circle
    ctx.beginPath();
    ctx.arc(flowNode.x || 0, flowNode.y || 0, nodeRadius, 0, 2 * Math.PI, false);
    ctx.fillStyle = 'rgba(31, 120, 180, 0.8)'; // Blue color
    ctx.fill();

    // Draw label
    ctx.font = `${fontSize}px Sans-Serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'black';
    ctx.fillText(label, flowNode.x || 0, (flowNode.y || 0) + nodeRadius + fontSize * 0.6);
  }, []);

  // Link styling
  const linkCanvasObject = useCallback((link: LinkObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const flowLink = link as FlowLink;
    const start = link.source as FlowNode;
    const end = link.target as FlowNode;

    if (!start || !end || typeof start === 'string' || typeof end === 'string') return; // Ensure nodes are objects

    // Calculate link width based on value
    const linkWidth = Math.max(0.5, Math.min(5, (flowLink.value || 1) / 20)) / globalScale;

    ctx.beginPath();
    ctx.moveTo(start.x || 0, start.y || 0);
    ctx.lineTo(end.x || 0, end.y || 0);
    ctx.lineWidth = linkWidth;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.stroke();

    // Add arrowheads (optional)
    // ... (arrowhead drawing logic can be added here)

  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading User Flow...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (graphData.nodes.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="info">No user flow data available to display.</Alert>
      </Box>
    );
  }

  return (
    <Box ref={containerRef} sx={{ height: '70vh', width: '100%', border: '1px solid #e0e0e0', borderRadius: '4px', position: 'relative' }}>
      {dimensions.width > 0 && dimensions.height > 0 && (
        <ForceGraph2D
          ref={fgRef}
          graphData={graphData}
          nodeLabel="name"
          linkLabel={(link) => `${(link.source as FlowNode).name} → ${(link.target as FlowNode).name}: ${link.value} transitions`}
          nodeCanvasObject={nodeCanvasObject}
          linkCanvasObject={linkCanvasObject}
          linkDirectionalParticles={2} // Add particles to show flow direction
          linkDirectionalParticleSpeed={d => (d as FlowLink).value * 0.001}
          linkDirectionalParticleWidth={2}
          width={dimensions.width}
          height={dimensions.height}
          // Performance optimizations
          enableZoomInteraction={true}
          enablePanInteraction={true}
          enableNodeDrag={true}
          cooldownTicks={100} // Stop simulation sooner
          // Styling
          backgroundColor="#f9f9f9"
        />
      )}
    </Box>
  );
};

export default UserFlowDiagram;
