import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, CircularProgress, Alert, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
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

type LayoutType = 'force-directed' | 'hierarchical' | 'radial';

// Helper function to sanitize IDs for use in CSS selectors
const sanitizeIdForCSS = (id: string | any): string => {
  if (id === undefined || id === null) return 'unknown';
  // Convert to string if it's not already
  const idStr = id.toString();
  // Replace any characters that aren't valid in CSS selectors with underscores
  return idStr.replace(/[^\w\-]/g, '_');
};

// Helper function to ensure coordinates are valid numbers
const ensureValidCoordinate = (value: any): number => {
  if (value === undefined || value === null || isNaN(value)) {
    return 0; // Default to 0 if not a valid number
  }
  return Number(value);
};

const UserFlowDiagram: React.FC = () => {
  const [graphData, setGraphData] = useState<UserFlowData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'graph' | 'table'>('table');
  const [layoutType, setLayoutType] = useState<LayoutType>('hierarchical');
  const [highlightedLink, setHighlightedLink] = useState<string | null>(null);
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

    // Prepare data for D3 - Convert string IDs to objects and ensure all nodes have valid coordinates
    const nodes = graphData.nodes.map(node => ({
      ...node,
      x: Math.random() * width,  // Initialize with random position
      y: Math.random() * height  // Initialize with random position
    }));
    
    // Create links with proper source/target references to node objects
    const links = graphData.links.map(link => {
      const source = nodes.find(node => node.id === link.source) || { id: link.source, x: width/2, y: height/2 };
      const target = nodes.find(node => node.id === link.target) || { id: link.target, x: width/2, y: height/2 };
      
      // Create sanitized IDs for the link
      const sourceId = sanitizeIdForCSS(source.id);
      const targetId = sanitizeIdForCSS(target.id);
      
      return {
        source,
        target,
        value: link.value || 1, // Ensure value exists
        id: `${sourceId}-${targetId}`,  // Sanitized ID for the link
        sourceId,
        targetId
      };
    });

    // Pre-calculate node positions based on layout type
    let positionedNodes = nodes;
    
    if (layoutType === 'hierarchical') {
      // Create a simple top-to-bottom hierarchical layout
      const levels = {};
      const visited = new Set();
      
      // Find starting nodes (no incoming links)
      const hasIncoming = new Set();
      links.forEach(link => {
        hasIncoming.add(link.target.id);
      });
      
      // Assign levels starting with source nodes
      let currentLevel = 0;
      let currentLevelNodes = nodes.filter(node => !hasIncoming.has(node.id));
      
      // If no clear starting nodes, use nodes with more outgoing than incoming connections
      if (currentLevelNodes.length === 0) {
        const nodeConnections = {};
        nodes.forEach(node => {
          nodeConnections[node.id] = { incoming: 0, outgoing: 0 };
        });
        
        links.forEach(link => {
          nodeConnections[link.source.id].outgoing += 1;
          nodeConnections[link.target.id].incoming += 1;
        });
        
        currentLevelNodes = nodes.filter(node => 
          nodeConnections[node.id]?.outgoing > nodeConnections[node.id]?.incoming);
          
        // If still no clear starting nodes, just pick the first one
        if (currentLevelNodes.length === 0 && nodes.length > 0) {
          currentLevelNodes = [nodes[0]];
        }
      }
      
      // Perform a simplified hierarchical layout
      while (currentLevelNodes.length > 0 && currentLevel < 10) { // Prevent infinite loops
        const levelWidth = width * 0.8;
        const levelX = width * 0.1;
        const nodeSpacing = levelWidth / (currentLevelNodes.length + 1);
        
        currentLevelNodes.forEach((node, i) => {
          visited.add(node.id);
          node.x = levelX + (i + 1) * nodeSpacing;
          node.y = 80 + currentLevel * 120; // 120px between levels
        });
        
        // Find nodes for the next level
        const nextLevelNodes = [];
        currentLevelNodes.forEach(sourceNode => {
          const targets = links
            .filter(link => link.source.id === sourceNode.id)
            .map(link => nodes.find(n => n.id === link.target.id))
            .filter(Boolean);
          
          targets.forEach(target => {
            if (!visited.has(target.id) && !nextLevelNodes.includes(target)) {
              nextLevelNodes.push(target);
            }
          });
        });
        
        currentLevelNodes = nextLevelNodes;
        currentLevel++;
      }
      
      // Position any nodes not yet placed
      const unvisitedNodes = nodes.filter(node => !visited.has(node.id));
      if (unvisitedNodes.length > 0) {
        const levelWidth = width * 0.8;
        const levelX = width * 0.1;
        const nodeSpacing = levelWidth / (unvisitedNodes.length + 1);
        
        unvisitedNodes.forEach((node, i) => {
          node.x = levelX + (i + 1) * nodeSpacing;
          node.y = 80 + currentLevel * 120;
        });
      }
      
      positionedNodes = nodes;
    } 
    else if (layoutType === 'radial') {
      // Create a radial layout
      const center = { x: width / 2, y: height / 2 };
      const radius = Math.min(width, height) * 0.35;
      
      // Position nodes in a circle
      positionedNodes = nodes.map((node, i) => {
        const angle = (i / nodes.length) * 2 * Math.PI;
        return {
          ...node,
          x: center.x + radius * Math.cos(angle),
          y: center.y + radius * Math.sin(angle)
        };
      });
    } 
    else {
      // For force-directed, just add initial positions
      positionedNodes = nodes.map(node => ({
        ...node,
        x: node.x || Math.random() * width,
        y: node.y || Math.random() * height
      }));
    }

    // Calculate node sizes based on value (visit count)
    const nodeSize = d3.scaleLinear()
      .domain([0, d3.max(nodes, d => d.value) || 100])
      .range([10, 30]);

    // Calculate link stroke width based on value (transition count)
    const linkWidth = d3.scaleLinear()
      .domain([0, d3.max(links, d => d.value) || 50])
      .range([2, 10]);

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
      .attr('refX', 35) // Increased to position away from the node
      .attr('refY', 0)
      .attr('markerWidth', 8)  // Increased size
      .attr('markerHeight', 8) // Increased size
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#333'); // Darker arrow

    // Create a group for the graph
    const graph = svg.append('g');

    // Add zoom functionality
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        graph.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create simulation - how we handle positions
    const simulation = d3.forceSimulation(positionedNodes as any);

    // Apply forces based on layout type
    if (layoutType === 'force-directed') {
      simulation
        .force('link', d3.forceLink(links).id((d: any) => d.id).distance(100))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2));
    } 
    else if (layoutType === 'hierarchical') {
      // For hierarchical, use weak forces to keep pre-calculated positions
      simulation
        .force('link', d3.forceLink(links).id((d: any) => d.id).distance(120).strength(0.1))
        .force('x', d3.forceX().x((d: any) => d.x).strength(0.5))
        .force('y', d3.forceY().y((d: any) => d.y).strength(0.5));
    } 
    else if (layoutType === 'radial') {
      simulation
        .force('link', d3.forceLink(links).id((d: any) => d.id).distance(80))
        .force('charge', d3.forceManyBody().strength(-200))
        .force('x', d3.forceX().x((d: any) => d.x).strength(0.3))
        .force('y', d3.forceY().y((d: any) => d.y).strength(0.3));
    }

    // Create links with improved styling
    const link = graph.append('g')
      .attr('class', 'links')
      .selectAll('path')
      .data(links)
      .enter().append('path')
      .attr('id', (d: any) => `link-${d.sourceId}-${d.targetId}`) // Use sanitized IDs
      .attr('stroke-width', (d: any) => linkWidth(d.value))
      .attr('marker-end', 'url(#end-arrow)')
      .attr('fill', 'none')
      .attr('stroke', (d: any) => {
        // Create a gradient with sanitized IDs
        const gradientId = `link-gradient-${d.sourceId}-${d.targetId}`;
        
        const linkGradient = svg.append('defs')
          .append('linearGradient')
          .attr('id', gradientId)
          .attr('gradientUnits', 'userSpaceOnUse');
          
        linkGradient.append('stop')
          .attr('offset', '0%')
          .attr('stop-color', color(d.source.id));
          
        linkGradient.append('stop')
          .attr('offset', '100%')
          .attr('stop-color', color(d.target.id));
          
        return `url(#${gradientId})`;
      })
      .style('stroke-opacity', 0.7);

    // Create animated flow indicators on paths
    const flowDots = graph.append('g')
      .attr('class', 'flow-indicators')
      .selectAll('circle')
      .data(links)
      .enter()
      .append('circle')
      .attr('r', 3)
      .attr('fill', '#4285f4')
      .style('opacity', 0.7);

    // Create node containers
    const node = graph.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(positionedNodes)
      .enter().append('g')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any);

    // Add circle for each node
    node.append('circle')
      .attr('r', (d: any) => nodeSize(d.value))
      .attr('fill', (d: any) => color(d.id))
      .style('stroke', '#fff')
      .style('stroke-width', 2)
      .append('title')
      .text((d: any) => `${d.name}\nVisits: ${d.value}`);

    // Add text label
    node.append('text')
      .attr('dy', (d: any) => -nodeSize(d.value) - 5)
      .attr('text-anchor', 'middle')
      .text((d: any) => d.name)
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('pointer-events', 'none')
      .style('fill', '#333')
      .style('text-shadow', '0 0 3px white, 0 0 3px white, 0 0 3px white');

    // Handle simulation ticks - this updates positions of all elements
    simulation.on('tick', () => {
      try {
        // Constrain nodes to the visualization area
        positionedNodes.forEach((d: any) => {
          const r = nodeSize(d.value) || 10; // Fallback node size
          // Ensure valid coordinates
          d.x = ensureValidCoordinate(d.x);
          d.y = ensureValidCoordinate(d.y);
          // Keep within bounds
          d.x = Math.max(r, Math.min(width - r, d.x));
          d.y = Math.max(r, Math.min(height - r, d.y));
        });

        // Update link paths with improved path styling and validation
        link.attr('d', (d: any) => {
          try {
            // Get coordinates with validation
            const sourceX = ensureValidCoordinate(d.source?.x);
            const sourceY = ensureValidCoordinate(d.source?.y);
            const targetX = ensureValidCoordinate(d.target?.x);
            const targetY = ensureValidCoordinate(d.target?.y);

            // If any coordinate isn't valid, return a simple path
            if ([sourceX, sourceY, targetX, targetY].some(coord => coord === 0)) {
              return "M0,0 L0,0";
            }

            if (layoutType === 'hierarchical') {
              // For hierarchical layout, use angled paths
              const midY = (sourceY + targetY) / 2;
              return `M${sourceX},${sourceY} C${sourceX},${midY} ${targetX},${midY} ${targetX},${targetY}`;
            } else {
              // For other layouts, use curved paths
              return `M${sourceX},${sourceY} Q${(sourceX + targetX) / 2 + (targetY - sourceY) / 8},${(sourceY + targetY) / 2 + (sourceX - targetX) / 8} ${targetX},${targetY}`;
            }
          } catch (e) {
            // Fallback in case of error
            console.warn("Error creating path:", e);
            return "M0,0 L0,0"; // Return a minimal valid path
          }
        });

        // Update flow indicators (moving dots) with robust error handling
        flowDots.each(function(d: any) {
          try {
            // Skip animation if source or target is undefined
            if (!d.source || !d.target || !d.sourceId || !d.targetId) return;

            // Use sanitized IDs for selecting elements
            const pathId = `link-${d.sourceId}-${d.targetId}`;
            const path = document.getElementById(pathId) as SVGPathElement;
            
            if (path) {
              try {
                const pathLength = path.getTotalLength() || 0;
                if (pathLength > 0) {
                  // Calculate position based on current time
                  const t = (Date.now() % 3000) / 3000; // 3 second animation cycle
                  const point = path.getPointAtLength(pathLength * t);
                  if (point && typeof point.x === 'number' && typeof point.y === 'number') {
                    d3.select(this)
                      .attr('cx', point.x)
                      .attr('cy', point.y);
                  }
                }
              } catch (e) {
                // Silently handle errors with path animation
              }
            }
          } catch (e) {
            // Silently handle any errors that might occur during animation
          }
        });

        // Update node positions with validation
        node.attr('transform', (d: any) => {
          const x = ensureValidCoordinate(d.x);
          const y = ensureValidCoordinate(d.y);
          return `translate(${x},${y})`;
        });
      } catch (e) {
        console.warn("Simulation tick error:", e);
      }
    });

    // Drag functions with improved error handling
    function dragstarted(event: any, d: any) {
      try {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = ensureValidCoordinate(d.x);
        d.fy = ensureValidCoordinate(d.y);
      } catch (e) {
        console.warn("Drag start error:", e);
      }
    }

    function dragged(event: any, d: any) {
      try {
        d.fx = ensureValidCoordinate(event.x);
        d.fy = ensureValidCoordinate(event.y);
      } catch (e) {
        console.warn("Drag error:", e);
      }
    }

    function dragended(event: any, d: any) {
      try {
        if (!event.active) simulation.alphaTarget(0);
        // In hierarchical layout, keep nodes pinned where user placed them
        if (layoutType !== 'hierarchical') {
          d.fx = null;
          d.fy = null;
        }
      } catch (e) {
        console.warn("Drag end error:", e);
      }
    }

    // Return a cleanup function
    return () => {
      simulation.stop();
    };
  }, [graphData, viewMode, layoutType]);

  const handleLayoutChange = (event: SelectChangeEvent) => {
    setLayoutType(event.target.value as LayoutType);
  };

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
        <Box sx={{ display: 'flex', gap: 2 }}>
          {viewMode === 'graph' && (
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="layout-select-label">Layout</InputLabel>
              <Select
                labelId="layout-select-label"
                value={layoutType}
                label="Layout"
                onChange={handleLayoutChange}
              >
                <MenuItem value="hierarchical">Hierarchical</MenuItem>
                <MenuItem value="radial">Radial</MenuItem>
                <MenuItem value="force-directed">Force-Directed</MenuItem>
              </Select>
            </FormControl>
          )}
          <Button 
            variant={viewMode === 'table' ? 'contained' : 'outlined'} 
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
        {viewMode === 'graph' && ' The animated blue dots show direction of flow. You can drag nodes to rearrange, zoom with the mouse wheel, and hover for details.'}
      </Typography>
      
      {viewMode === 'graph' ? (
        <Box sx={{ 
          mt: 2, 
          border: '1px solid #ddd', 
          borderRadius: 1, 
          height: '600px',
          overflow: 'hidden',
          backgroundColor: '#f9f9f9',
          position: 'relative'
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