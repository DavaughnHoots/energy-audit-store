// scripts/heroku_verify_analytics_fix.js
// Check if analytics endpoints are working after the fix

const https = require('https');
const { v4: uuidv4 } = require('uuid');

const API_BASE_URL = 'energy-audit-store-e66479ed4f2b.herokuapp.com';

// Create a session
const sessionId = uuidv4();
console.log(`Testing with session ID: ${sessionId}`);

// Helper function to make requests
function makeRequest(path, method, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_BASE_URL,
      port: 443,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        console.log(`${method} ${path} - Status: ${res.statusCode}`);
        try {
          const parsedData = JSON.parse(responseData);
          resolve({ statusCode: res.statusCode, data: parsedData });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      console.error(`Error with ${method} ${path}:`, error.message);
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test sequence
async function runTests() {
  try {
    console.log('=== Testing Analytics Endpoints ===');

    // Test 1: Create Session
    console.log('\n1. Testing session creation...');
    const sessionResult = await makeRequest(
      '/api/analytics/session', 
      'POST', 
      { sessionId }
    );
    
    if (sessionResult.statusCode === 200) {
      console.log('✅ Session endpoint is working!');
    } else {
      console.log('❌ Session endpoint failed:', sessionResult.data);
    }

    // Test 2: Track Event
    console.log('\n2. Testing event tracking...');
    const eventResult = await makeRequest(
      '/api/analytics/event', 
      'POST', 
      { 
        sessionId,
        eventType: 'test_event',
        area: 'verification',
        data: {
          source: 'verification_script',
          timestamp: new Date().toISOString()
        }
      }
    );
    
    if (eventResult.statusCode === 200) {
      console.log('✅ Event tracking endpoint is working!');
    } else {
      console.log('❌ Event tracking endpoint failed:', eventResult.data);
    }

    // Test 3: Check Dashboard
    console.log('\n3. Testing dashboard endpoint (anonymous user won\'t have access)...');
    const dashboardResult = await makeRequest('/api/analytics/dashboard', 'GET');
    
    if (dashboardResult.statusCode === 401) {
      console.log('✅ Dashboard endpoint accessibility check passed (requires auth as expected)');
    } else {
      console.log('❓ Dashboard endpoint returned unexpected status:', dashboardResult.statusCode);
    }

    console.log('\nVerification complete!');
    if (sessionResult.statusCode === 200 && eventResult.statusCode === 200) {
      console.log('✅✅✅ Analytics fix appears to be working! ✅✅✅');
      console.log('The app should no longer crash when analytics events are sent.');
    } else {
      console.log('❌❌❌ Analytics fix still has issues. Check the logs for details. ❌❌❌');
    }
  } catch (error) {
    console.error('Error running verification:', error);
  }
}

// Run the tests
runTests();
