import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, CircularProgress, Alert, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button } from '@mui/material';
import apiClient from '../../services/apiClient';
import * as d3 from 'd3';

interface FlowNode {
  id: string;
  name: string;
  value: number; // Represents visit count or importance
}

interface FlowLink {
  source: string;
  target: string;
  value: number; // Represents transition count
}

interface UserFlowData {
  nodes: FlowNode[];
  links: FlowLink[];
}

const UserFlowDiagram: React.FC = () => {
  const [graphData, setGraphData] = useState<UserFlowData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'graph' | 'table'>('table');
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Function to fetch data
  const loadUserFlowData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/admin/analytics/user-flow-diagram');
      
      // Check if the response is in the expected format
      const responseData = response.data;
      let flowData: UserFlowData;
      
      // Handle different response structures
      if (responseData?.nodes && responseData?.links) {
        // Direct format: { nodes: [...], links: [...] }
        flowData = responseData as UserFlowData;
      } else if (responseData?.data?.nodes && responseData?.data?.links) {
        // Nested format: { data: { nodes: [...], links: [...] } }
        flowData = responseData.data as UserFlowData;
      } else {
        // No valid data structure found
        console.error('Unexpected API response format:', responseData);
        throw new Error('Invalid data format received from the server');
      }
      
      setGraphData(flowData);
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

  // Create D3 visualization
  useEffect(() => {
    if (!svgRef.current || graphData.nodes.length === 0 || viewMode !== 'graph') return;

    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();

    const width = 800;
    const height = 600;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };

    // Prepare data for D3 - Convert string IDs to objects
    const nodes = graphData.nodes.map(node => ({ ...node }));
    
    // Create links with proper source/target references to node objects
    const links = graphData.links.map(link => {
      const source = nodes.find(node => node.id === link.source) || { id: link.source };
      const target = nodes.find(node => node.id === link.target) || { id: link.target };
      return {
        source,
        target,
        value: link.value
      };
    });

    // Calculate node sizes based on value (visit count)
    const nodeSize = d3.scaleLinear()
      .domain([0, d3.max(nodes, d => d.value) || 100])
      .range([5, 25]);

    // Calculate link stroke width based on value (transition count)
    const linkWidth = d3.scaleLinear()
      .domain([0, d3.max(links, d => d.value) || 50])
      .range([1, 10]);

    // Create color scale for nodes
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Create SVG container
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    // Create arrow marker definition for directed graph
    svg.append('defs').selectAll('marker')
      .data(['end-arrow'])
      .enter().append('marker')
      .attr('id', d => d)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 23)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#999');

    // Create a group for the graph
    const graph = svg.append('g');

    // Add zoom functionality
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        graph.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create the simulation
    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('x', d3.forceX(width / 2).strength(0.1))
      .force('y', d3.forceY(height / 2).strength(0.1));

    // Create links
    const link = graph.append('g')
      .attr('class', 'links')
      .selectAll('path')
      .data(links)
      .enter().append('path')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => linkWidth(d.value))
      .attr('marker-end', 'url(#end-arrow)')
      .attr('fill', 'none');

    // Create node containers
    const node = graph.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any);

    // Add circle for each node
    node.append('circle')
      .attr('r', d => nodeSize(d.value))
      .attr('fill', d => color(d.id))
      .append('title')
      .text(d => `${d.name}\nVisits: ${d.value}`);

    // Add text label
    node.append('text')
      .attr('dy', 4)
      .attr('dx', d => nodeSize(d.value) + 5)
      .text(d => d.name)
      .style('font-size', '12px')
      .style('pointer-events', 'none');

    // Handle simulation ticks
    simulation.on('tick', () => {
      // Constrain nodes to the visualization area
      nodes.forEach((d: any) => {
        d.x = Math.max(nodeSize(d.value), Math.min(width - nodeSize(d.value), d.x));
        d.y = Math.max(nodeSize(d.value), Math.min(height - nodeSize(d.value), d.y));
      });

      // Update link positions
      link.attr('d', (d: any) => {
        const sourceX = d.source.x;
        const sourceY = d.source.y;
        const targetX = d.target.x;
        const targetY = d.target.y;

        // Calculate the angle for the arc
        const dx = targetX - sourceX;
        const dy = targetY - sourceY;
        const dr = Math.sqrt(dx * dx + dy * dy) * 1.2;

        // Draw a curved path
        return `M${sourceX},${sourceY}A${dr},${dr} 0 0,1 ${targetX},${targetY}`;
      });

      // Update node positions
      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Return a cleanup function
    return () => {
      simulation.stop();
    };
  }, [graphData, viewMode]);

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
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">User Flow Diagram</Typography>
        <Box>
          <Button 
            variant={viewMode === 'table' ? 'contained' : 'outlined'} 
            sx={{ mr: 1 }}
            onClick={() => setViewMode('table')}
          >
            Table View
          </Button>
          <Button 
            variant={viewMode === 'graph' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('graph')}
          >
            Graph View
          </Button>
        </Box>
      </Box>
      
      <Typography variant="body2" paragraph>
        This visualization shows the flow of users between different pages on your site.
        {viewMode === 'graph' && ' You can drag nodes to rearrange, zoom with the mouse wheel, and hover for more details.'}
      </Typography>
      
      {viewMode === 'graph' ? (
        <Box sx={{ 
          mt: 2, 
          border: '1px solid #ddd', 
          borderRadius: 1, 
          height: '600px',
          overflow: 'hidden',
          backgroundColor: '#f9f9f9'
        }}>
          <svg ref={svgRef} width="100%" height="100%"></svg>
        </Box>
      ) : (
        <>
          {/* Page Nodes Table */}
          <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>Pages (Nodes)</Typography>
          <TableContainer component={Paper} sx={{ mb: 4 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Page</TableCell>
                  <TableCell align="right">Visit Count</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {graphData.nodes.slice(0, 10).map((node) => (
                  <TableRow key={node.id}>
                    <TableCell>{node.name}</TableCell>
                    <TableCell align="right">{node.value}</TableCell>
                  </TableRow>
                ))}
                {graphData.nodes.length > 10 && (
                  <TableRow>
                    <TableCell colSpan={2} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Showing 10 of {graphData.nodes.length} pages
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Transitions Table */}
          <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>Page Transitions (Links)</Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>From Page</TableCell>
                  <TableCell>To Page</TableCell>
                  <TableCell align="right">Transition Count</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {graphData.links && graphData.links.slice(0, 10).map((link, index) => {
                  // Find the node names for better display
                  const sourceId = typeof link.source === 'string' ? link.source : (link.source as any)?.id || '';
                  const targetId = typeof link.target === 'string' ? link.target : (link.target as any)?.id || '';
                  const sourceNode = graphData.nodes?.find(node => node.id === sourceId) || { name: sourceId };
                  const targetNode = graphData.nodes?.find(node => node.id === targetId) || { name: targetId };
                  
                  return (
                    <TableRow key={index}>
                      <TableCell>{sourceNode.name}</TableCell>
                      <TableCell>{targetNode.name}</TableCell>
                      <TableCell align="right">{link.value}</TableCell>
                    </TableRow>
                  );
                })}
                {graphData.links.length > 10 && (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Showing 10 of {graphData.links.length} transitions
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
};

export default UserFlowDiagram;