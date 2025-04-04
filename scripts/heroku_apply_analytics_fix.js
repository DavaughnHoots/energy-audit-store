/**
 * Script to fix the analytics direct writing issue in Heroku
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting analytics direct write fix deployment...');

// Path to the analytics route file
const analyticsRoutePath = path.join(__dirname, '../backend/src/routes/analytics.ts');

// Read the current file content
console.log('📄 Reading analytics route file...');
const originalContent = fs.readFileSync(analyticsRoutePath, 'utf8');

// Fix to add proper error handling around direct database writes
const fixedContent = originalContent.replace(
  /router\.post\('\/event',\s*optionalTokenValidation,\s*async \(req, res\) => {[\s\S]*?\/\/ Track the event with direct database write\s*await analyticsService\.trackEvent\(sessionId, eventType, area, data \|\| {}\);\s*\s*res\.status\(200\)\.json\({ success: true }\);/,
  `router.post('/event',
  optionalTokenValidation,
  async (req, res) => {
    try {
      const { eventType, area, data, sessionId } = req.body;
      
      // Log the event tracking request
      appLogger.debug('Analytics event tracking request:', createLogMetadata(req, {
        eventType,
        area,
        hasSessionId: !!sessionId
      }));

      if (!eventType || !area || !sessionId) {
        return res.status(400).json({ error: 'Missing required fields: eventType, area, sessionId' });
      }

      // Get user ID if authenticated
      const userId = req.user?.id;

      try {
        // Direct database write - don't rely on session updating
        await analyticsService.trackEvent(sessionId, eventType, area, data || {});
        
        // Return success response immediately
        return res.status(200).json({ success: true });
      } catch (dbError) {
        // Log database error but don't expose details to client
        appLogger.error('Database error in analytics event tracking:', createLogMetadata(req, {
          error: dbError instanceof Error ? dbError.message : 'Unknown database error',
          stack: dbError instanceof Error ? dbError.stack : undefined,
          eventType,
          area
        }));
        
        // Return a generic error to the client
        return res.status(500).json({ error: 'Could not process analytics event', success: false });
      }`
);

// Write the fixed content back to the file
console.log('✅ Applying fix to analytics route file...');
fs.writeFileSync(analyticsRoutePath, fixedContent, 'utf8');

// Deploy to Heroku
console.log('🚀 Deploying to Heroku...');
try {
  execSync('git add .', { stdio: 'inherit' });
  execSync('git commit -m "Fix: Direct analytics event endpoint with improved error handling"', { stdio: 'inherit' });
  execSync('git push heroku HEAD:main', { stdio: 'inherit' });
  console.log('✅ Deployment successful!');
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}

console.log('🔍 Running diagnostics to verify fix...');
try {
  execSync('heroku logs --tail --app energy-audit-store-e66479ed4f2b', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Diagnostic check failed:', error.message);
}

console.log('✅ Analytics fix deployment complete!');
