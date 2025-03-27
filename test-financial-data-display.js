/**
 * Test script for debugging financial data display issues
 * This script helps diagnose why financial values might not be appearing in the
 * interactive report interface
 */

// Create a simple HTTP server that serves test data
const http = require('http');
const fs = require('fs');
const path = require('path');

// Sample recommendation data with financial values
const sampleRecommendations = [
  {
    id: "rec1",
    title: "HVAC System Upgrade",
    description: "Replace the existing HVAC system with a high-efficiency model",
    type: "HVAC System Upgrade",
    priority: "high",
    status: "active",
    estimatedSavings: 710,
    estimatedCost: 8994,
    paybackPeriod: 12.7,
    actualSavings: null,
    implementationDate: null,
    implementationCost: null,
    lastUpdate: "2025-03-26T14:30:00Z",
    scope: "whole home",
    isEstimated: true
  },
  {
    id: "rec2",
    title: "Lighting System Upgrade",
    description: "Replace incandescent bulbs with LED lighting",
    type: "Lighting System Upgrade",
    priority: "medium",
    status: "active",
    estimatedSavings: 0, // Testing zero value
    estimatedCost: 569,
    paybackPeriod: 5.7,
    actualSavings: null,
    implementationDate: null,
    implementationCost: null,
    lastUpdate: "2025-03-26T14:30:00Z",
    scope: "kitchen, living room, master bedroom",
    isEstimated: true
  },
  {
    id: "rec3",
    title: "Install Dehumidification System",
    description: "Install dehumidification system with NaN pints/day capacity",
    type: "Install Dehumidification System",
    priority: "low",
    status: "active",
    estimatedSavings: null, // Testing null value
    estimatedCost: undefined, // Testing undefined value
    paybackPeriod: NaN, // Testing NaN value
    actualSavings: null,
    implementationDate: null,
    implementationCost: null,
    lastUpdate: "2025-03-26T14:30:00Z",
    scope: "whole home",
    isEstimated: true
  }
];

// Create sample report data
const sampleReportData = {
  auditInfo: {
    id: "test-audit-123",
    createdAt: "2025-03-26T14:30:00Z",
    homeType: "single-family"
  },
  propertyInfo: {
    address: "123 Main St, Anytown, US",
    squareFootage: 2200,
    yearBuilt: 1985
  },
  executiveSummary: {
    efficiencyScore: 65,
    estimatedSavings: 1200,
    recommendations: sampleRecommendations.length
  },
  recommendations: sampleRecommendations,
  energyConsumption: {
    monthlyBill: 180,
    usageBreakdown: {
      hvac: 45,
      lighting: 15,
      appliances: 25,
      other: 15
    }
  }
};

// Create an HTTP server
const server = http.createServer((req, res) => {
  console.log(`Received request: ${req.method} ${req.url}`);

  // Enable CORS for local testing
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Mock endpoint for report data
  if (req.url.includes('/report-data/')) {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    
    // Deep clone the data to avoid modifications between requests
    const responseData = JSON.parse(JSON.stringify(sampleReportData));
    
    // Log what we're sending
    console.log('Sending sample data with recommendations:');
    responseData.recommendations.forEach(rec => {
      console.log(`  - ${rec.title}: savings=${rec.estimatedSavings}, cost=${rec.estimatedCost}, payback=${rec.paybackPeriod}`);
    });
    
    res.end(JSON.stringify(responseData));
    return;
  }

  // Default response
  res.writeHead(404);
  res.end('Not found');
});

// Start the server
const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
  console.log(`To test financial data display:`);
  console.log(`1. Update src/config/api.ts to point REPORT_DATA to http://localhost:${PORT}/report-data/`);
  console.log(`2. Start your frontend development server`);
  console.log(`3. Load the report page and check if financial data is displayed correctly`);
  console.log(`4. Press Ctrl+C to stop this server when done testing`);
});
