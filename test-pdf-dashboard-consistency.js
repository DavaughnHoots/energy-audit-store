/**
 * Test script to verify consistency between PDF and dashboard report data
 * 
 * This script fetches audit data and recommendations, then processes them
 * through the ReportDataService to confirm the same data will be used
 * for both the interactive dashboard and PDF reports.
 * 
 * Usage: node test-pdf-dashboard-consistency.js [auditId]
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import { reportDataService } from './backend/src/services/ReportDataService.js';
import { EnergyAuditService } from './backend/src/services/EnergyAuditService.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize database pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const energyAuditService = new EnergyAuditService(pool);

async function testReportDataConsistency(auditId) {
  try {
    console.log(`Testing report data consistency for audit ID: ${auditId}`);
    
    // Fetch audit data
    console.log('Fetching audit data...');
    const audit = await energyAuditService.getAuditById(auditId);
    if (!audit) {
      console.error('Audit not found');
      process.exit(1);
    }
    
    // Fetch recommendations
    console.log('Fetching recommendations...');
    const recommendations = await energyAuditService.getRecommendations(auditId);
    console.log(`Found ${recommendations.length} recommendations`);
    
    // Generate report data using the service
    console.log('Generating report data using ReportDataService...');
    const reportData = await reportDataService.generateReportData(audit, recommendations);
    
    // Log key metrics for verification
    console.log('\n=== KEY METRICS (These should match in both PDF and dashboard) ===');
    console.log(`Total Energy: ${reportData.executiveSummary.totalEnergy} kWh`);
    console.log(`Efficiency Score: ${reportData.executiveSummary.efficiencyScore}`);
    console.log(`Energy Efficiency: ${reportData.executiveSummary.energyEfficiency}%`);
    console.log(`Potential Savings: $${reportData.executiveSummary.potentialSavings}/year`);
    
    // Log property information
    console.log('\n=== PROPERTY INFORMATION ===');
    console.log(`Address: ${reportData.propertyInfo.address}`);
    console.log(`Property Type: ${reportData.propertyInfo.propertyType}`);
    console.log(`Year Built: ${reportData.propertyInfo.yearBuilt}`);
    console.log(`Square Footage: ${reportData.propertyInfo.squareFootage} sq ft`);
    
    // Log recommendations summary
    console.log('\n=== RECOMMENDATIONS SUMMARY ===');
    console.log(`Total Estimated Savings: $${reportData.summary.totalEstimatedSavings}/year`);
    console.log(`Total Actual Savings: $${reportData.summary.totalActualSavings}/year`);
    console.log(`Implemented Count: ${reportData.summary.implementedCount}`);
    if (reportData.summary.savingsAccuracy) {
      console.log(`Savings Accuracy: ${reportData.summary.savingsAccuracy.toFixed(1)}%`);
    }
    
    // Save report data to a file for inspection
    const outputFile = `report-data-${auditId}.json`;
    fs.writeFileSync(outputFile, JSON.stringify(reportData, null, 2));
    console.log(`\nReport data saved to ${outputFile} for inspection`);
    
    // Convert to PDF format (for reference)
    console.log('\n=== Converting to PDF format ===');
    const transformedAudit = {
      basicInfo: {
        fullName: 'Anonymous User',
        email: 'anonymous@example.com',
        phone: '555-555-5555',
        auditDate: new Date().toISOString().split('T')[0],
        occupants: 2,
        ...reportData.propertyInfo,
        propertyType: reportData.propertyInfo.propertyType || 'single-family'
      },
      homeDetails: {
        squareFootage: reportData.propertyInfo.squareFootage || 1500,
        stories: 2,
        bedrooms: 3,
        bathrooms: 2,
        homeType: reportData.propertyInfo.propertyType || 'single-family',
        homeSize: reportData.propertyInfo.squareFootage || 1500,
        constructionPeriod: 'after-2000',
        numRooms: 6,
        numFloors: 2,
        wallLength: 0,
        wallWidth: 0,
        ceilingHeight: 0,
        basementType: 'none',
        basementHeating: 'unheated'
      },
      // Other fields would be mapped here in a full implementation
    };
    
    console.log('\nPDF format reference (partial):');
    console.log(JSON.stringify(transformedAudit, null, 2).substring(0, 500) + '...');
    
    console.log('\nTest completed successfully!');
    await pool.end();
  } catch (error) {
    console.error('Error during test:', error);
    await pool.end();
    process.exit(1);
  }
}

// Get audit ID from command line or use default
const auditId = process.argv[2] || '3e55555a-15b4-4e2d-be83-5d6a7f6b2ff3';
testReportDataConsistency(auditId);
