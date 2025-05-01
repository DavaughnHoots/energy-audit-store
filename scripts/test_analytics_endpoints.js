#!/usr/bin/env node

/**
 * Test Admin Analytics Endpoints
 * 
 * This script tests all admin analytics endpoints and reports their status.
 * It uses the same authentication mechanism as the frontend.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'https://energy-audit-store-e66479ed4f2b.herokuapp.com';
const ACCESS_TOKEN = process.argv[2]; // Pass access token as first argument
const REFRESH_TOKEN = process.argv[3]; // Pass refresh token as second argument

if (!ACCESS_TOKEN || !REFRESH_TOKEN) {
  console.error('Error: You must provide access and refresh tokens as arguments!');
  console.log('Usage: node test_analytics_endpoints.js "<access_token>" "<refresh_token>"');
  process.exit(1);
}

// Create API client with authentication
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Origin': BASE_URL
  }
});

// Add auth token to requests
apiClient.interceptors.request.use(config => {
  // Set the Authorization header with bearer token
  config.headers['Authorization'] = `Bearer ${ACCESS_TOKEN}`;
  
  // Add cookies for token-based auth as backup
  config.headers['Cookie'] = `accessToken=${ACCESS_TOKEN}; refreshToken=${REFRESH_TOKEN}`;
  
  return config;
});

// Endpoints to test
const endpoints = [
  '/api/admin/analytics/most-visited',
  '/api/admin/analytics/most-used-features',
  '/api/admin/analytics/user-journeys',
  '/api/admin/analytics/feature-correlations',
  '/api/admin/analytics/navigation-flows',
  '/api/admin/analytics/session-timeline',
  '/api/admin/analytics/user-flow-diagram'
];

// Format endpoint name for display
const formatEndpointName = (endpoint) => {
  const name = endpoint.split('/').pop();
  return name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

// Test each endpoint
async function testEndpoints() {
  console.log('🧪 Testing Admin Analytics Endpoints...');
  console.log('====================================\n');
  
  const results = [];
  
  for (const endpoint of endpoints) {
    process.stdout.write(`Testing ${formatEndpointName(endpoint)}... `);
    
    try {
      const response = await apiClient.get(endpoint);
      const data = response.data;
      
      const success = data && (Array.isArray(data) ? data.length > 0 : true);
      const dataType = Array.isArray(data) ? 'array' : typeof data;
      const dataSize = Array.isArray(data) ? data.length : 
                        (typeof data === 'object' ? Object.keys(data).length : 'n/a');
      
      results.push({
        endpoint,
        status: response.status,
        success,
        dataType,
        dataSize
      });
      
      console.log(`✅ [${response.status}] (${dataType} with ${dataSize} items)`);
    } catch (error) {
      const status = error.response?.status || 'ERROR';
      const message = error.response?.data?.message || error.message;
      
      results.push({
        endpoint,
        status,
        success: false,
        error: message
      });
      
      console.log(`❌ [${status}] ${message}`);
    }
  }
  
  console.log('\n====================================');
  console.log('📊 Summary');
  console.log('====================================');
  
  const workingEndpoints = results.filter(r => r.success);
  const failingEndpoints = results.filter(r => !r.success);
  
  console.log(`✅ Working endpoints: ${workingEndpoints.length}/${endpoints.length}`);
  console.log(`❌ Failing endpoints: ${failingEndpoints.length}/${endpoints.length}`);
  
  if (failingEndpoints.length > 0) {
    console.log('\n🔧 Failed endpoints that need fixing:');
    failingEndpoints.forEach(e => {
      console.log(`  - ${formatEndpointName(e.endpoint)}: [${e.status}] ${e.error || 'Unknown error'}`);
    });
  }
  
  console.log('\n📝 Next steps:');
  if (failingEndpoints.length > 0) {
    console.log('  1. Fix failing backend endpoints');
    console.log('  2. Deploy backend changes');
    console.log('  3. Verify frontend components display data correctly');
  } else {
    console.log('  1. Verify frontend components display data correctly');
    console.log('  2. Fix any frontend component display issues');
  }
}

// Run the tests
testEndpoints().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});
