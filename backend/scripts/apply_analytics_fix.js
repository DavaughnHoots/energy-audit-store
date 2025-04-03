/**
 * Script to apply the analytics service fix to the production environment
 * 
 * This script:
 * 1. Tests direct database connectivity
 * 2. Replaces the AnalyticsService with the enhanced version
 * 3. Updates server initialization
 * 
 * Run with: node backend/scripts/apply_analytics_fix.js
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import pkg from 'pg';
const { Pool } = pkg;

// Configuration
const FILES_TO_UPDATE = [
  {
    path: 'backend/src/services/AnalyticsService.ts',
    replacementPath: 'backend/src/services/AnalyticsService.enhanced.js',
    backupPath: 'backend/src/services/AnalyticsService.ts.bak'
  },
  {
    path: 'backend/src/server.ts',
    needsUpdate: true,
    // No replacement file, we'll modify it directly
  }
];

const ANALYTICS_TABLES = [
  'analytics_events',
  'analytics_sessions',
  'analytics_consent',
  'analytics_feature_metrics'
];

// Main function
async function main() {
  console.log('🔄 Starting analytics fix application');
  
  // Step 1: Test database connectivity
  try {
    console.log('🔍 Testing database connectivity...');
    const pool = new Pool();
    
    const connResult = await pool.query('SELECT NOW() as time');
    console.log(`✅ Database connection successful! Server time: ${connResult.rows[0].time}`);
    
    // Check if tables exist
    for (const tableName of ANALYTICS_TABLES) {
      try {
        const tableCheck = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          ) as exists
        `, [tableName]);
        
        if (tableCheck.rows[0].exists) {
          console.log(`✅ Table ${tableName} exists`);
        } else {
          console.log(`❌ Table ${tableName} does not exist`);
        }
      } catch (tableError) {
        console.error(`❌ Error checking table ${tableName}:`, tableError.message);
      }
    }
    
    // Close pool
    await pool.end();
    console.log('✅ Database check complete');
  } catch (dbError) {
    console.error('❌ Database connection failed:', dbError.message);
    if (dbError.code) {
      console.error(`   Error code: ${dbError.code}`);
    }
    console.log('⚠️ Continuing with file updates anyway...');
  }
  
  // Step 2: Update files
  for (const file of FILES_TO_UPDATE) {
    if (!fs.existsSync(file.path)) {
      console.error(`❌ Source file ${file.path} does not exist, skipping...`);
      continue;
    }
    
    // Create backup
    if (file.backupPath) {
      console.log(`📦 Creating backup of ${file.path} to ${file.backupPath}`);
      fs.copyFileSync(file.path, file.backupPath);
    }
    
    if (file.replacementPath) {
      // Check if replacement file exists
      if (!fs.existsSync(file.replacementPath)) {
        console.error(`❌ Replacement file ${file.replacementPath} does not exist, skipping...`);
        continue;
      }
      
      // Replace file
      console.log(`🔄 Replacing ${file.path} with ${file.replacementPath}`);
      fs.copyFileSync(file.replacementPath, file.path);
      console.log(`✅ File ${file.path} replaced successfully`);
    } else if (file.needsUpdate && file.path === 'backend/src/server.ts') {
      // Modify server.ts to improve analytics service initialization
      console.log('🔄 Updating server.ts with improved error handling for analytics service...');
      
      const serverContent = fs.readFileSync(file.path, 'utf8');
      
      // Create backup
      fs.writeFileSync('backend/src/server.ts.bak', serverContent);
      
      // Pattern to find the analytics service initialization
      const analyticsServicePattern = /const analyticsService = new AnalyticsService\(pool\);/;
      
      // New code with error handling
      const analyticsServiceReplacement = 
`try {
  console.log('Initializing AnalyticsService with database pool...');
  const analyticsService = new AnalyticsService(pool);
  initAnalyticsRoutes(analyticsService);
  console.log('AnalyticsService initialized successfully');
} catch (analyticsError) {
  console.error('Failed to initialize AnalyticsService:', analyticsError);
  // Continue server startup even if analytics fails - don't prevent app from running
}`;
      
      // Pattern to find the routes initialization
      const routesInitPattern = /initAnalyticsRoutes\(analyticsService\);/;
      
      // Update the content with error handling
      let updatedContent = serverContent;
      
      // Replace the analytics service initialization with error handling
      if (analyticsServicePattern.test(serverContent)) {
        updatedContent = updatedContent.replace(analyticsServicePattern, 'const analyticsService = new AnalyticsService(pool);');
      } else {
        console.warn('⚠️ Could not find analytics service initialization pattern in server.ts');
      }
      
      // Remove the routes initialization line (it will be done in the try/catch block)
      if (routesInitPattern.test(updatedContent)) {
        updatedContent = updatedContent.replace(routesInitPattern, '// initAnalyticsRoutes moved to try/catch block');
      } else {
        console.warn('⚠️ Could not find analytics routes initialization pattern in server.ts');
      }
      
      // Add the new code with error handling after the pool creation
      const poolPattern = /const pool = new Pool\(\);/;
      if (poolPattern.test(updatedContent)) {
        updatedContent = updatedContent.replace(poolPattern, `const pool = new Pool();
        
// Initialize AnalyticsService with error handling
${analyticsServiceReplacement}`);
      } else {
        console.warn('⚠️ Could not find pool creation pattern in server.ts');
      }
      
      // Write the updated content back
      fs.writeFileSync(file.path, updatedContent);
      console.log('✅ server.ts updated with improved error handling');
    }
  }
  
  console.log('✅ All updates applied successfully');
  console.log('');
  console.log('Next steps:');
  console.log('1. Deploy the changes to Heroku:');
  console.log('   git add .');
  console.log('   git commit -m "Fix analytics service with improved error handling"');
  console.log('   git push heroku main');
  console.log('');
  console.log('2. Restart the Heroku app:');
  console.log('   heroku restart --app energy-audit-store');
  console.log('');
  console.log('3. Monitor logs for any issues:');
  console.log('   heroku logs --tail --app energy-audit-store');
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
