import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import axios from 'axios';

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
  
  // Function to fetch data
  const loadUserFlowData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<UserFlowData>('/api/admin/analytics/user-flow-diagram', {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      setGraphData(response.data);
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
      <Typography variant="h6" gutterBottom>User Flow Diagram</Typography>
      <Typography variant="body2" paragraph>
        This table shows the flow of users between different pages on your site.
        Each row represents a transition from one page to another, with the frequency shown.
      </Typography>
      
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
            {graphData.links.slice(0, 10).map((link, index) => {
              // Find the node names for better display
              const sourceNode = graphData.nodes.find(node => node.id === link.source) || { name: link.source };
              const targetNode = graphData.nodes.find(node => node.id === link.target) || { name: link.target };
              
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

      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="body2" color="text.secondary">
          Note: Interactive graph visualization will be available in a future update.
        </Typography>
      </Box>
    </Box>
  );
};

export default UserFlowDiagram;