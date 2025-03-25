const axios = require('axios');
const auditId = process.argv[2]; // Get audit ID from command line arguments

if (!auditId) {
  console.error('Please provide an audit ID as a command line argument');
  console.log('Example: node test-interactive-report.js abc123');
  process.exit(1);
}

async function testReportDataEndpoint() {
  console.log('Testing Interactive Report Preview');
  console.log('==================================');
  
  try {
    console.log(`Fetching report data for audit ID: ${auditId}`);
    const response = await axios.get(`http://localhost:3000/api/energy-audit/${auditId}/report-data`);
    
    if (response.status === 200) {
      console.log('✅ Report data endpoint is working correctly!');
      
      // Check and log the structure of the returned data
      const data = response.data;
      
      console.log('\nReport Data Overview:');
      console.log('====================');
      
      // Check executive summary
      if (data.executiveSummary) {
        console.log('✅ Executive Summary data is present');
        console.log(`   Efficiency Score: ${data.executiveSummary.efficiencyScore}`);
        console.log(`   Potential Savings: $${data.executiveSummary.potentialSavings}`);
      } else {
        console.log('❌ Executive Summary data is missing');
      }
      
      // Check property info
      if (data.propertyInfo) {
        console.log('✅ Property Information data is present');
        console.log(`   Address: ${data.propertyInfo.address}`);
        console.log(`   Square Footage: ${data.propertyInfo.squareFootage} sq ft`);
      } else {
        console.log('❌ Property Information data is missing');
      }
      
      // Check recommendations
      if (data.recommendations && Array.isArray(data.recommendations)) {
        console.log('✅ Recommendations data is present');
        console.log(`   Total Recommendations: ${data.recommendations.length}`);
        if (data.recommendations.length > 0) {
          console.log(`   First Recommendation: ${data.recommendations[0].title}`);
        }
      } else {
        console.log('❌ Recommendations data is missing or not an array');
      }
      
      // Check chart data
      if (data.charts) {
        console.log('✅ Chart data is present');
        if (data.charts.energyBreakdown) {
          console.log(`   Energy Breakdown Chart: ${data.charts.energyBreakdown.length} data points`);
        }
        if (data.charts.savingsAnalysis) {
          console.log(`   Savings Analysis Chart: ${data.charts.savingsAnalysis.length} data points`);
        }
      } else {
        console.log('❌ Chart data is missing');
      }
      
      console.log('\n🎉 Interactive Report Preview implementation complete!');
      console.log(`Visit the interactive report at: http://localhost:3000/energy-audit/${auditId}/report`);
    } else {
      console.log(`❌ Error: Unexpected status code: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Error testing report data endpoint:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Error: ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(error.message);
    }
  }
}

testReportDataEndpoint();
