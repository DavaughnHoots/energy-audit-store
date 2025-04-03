/**
 * Script to apply the analytics fix to the server
 * This script updates the routes/analytics.ts file to use the enhanced AnalyticsService
 */

const fs = require('fs');
const path = require('path');

// Define paths
const routesPath = path.join(__dirname, '..', 'src', 'routes', 'analytics.ts');
const backupPath = routesPath + '.bak';

// Backup the original file
console.log('Backing up original analytics.ts file...');
fs.copyFileSync(routesPath, backupPath);
console.log(`Backup created at ${backupPath}`);

// Read the original file
console.log('Reading analytics routes file...');
const originalContent = fs.readFileSync(routesPath, 'utf8');

// Modify the import to use the enhanced service
console.log('Applying analytics fix...');
let updatedContent = originalContent.replace(
  "import { AnalyticsService } from '../services/AnalyticsService.js';",
  "import { AnalyticsService } from '../services/AnalyticsService.enhanced.js';"
);

// Apply the fix - add additional validation to the saveEvents endpoint
updatedContent = updatedContent.replace(
  /router\.post\(['"]\/events['"]\s*,\s*async.*?try\s*{/s,
  match => match + `
    // Validate sessionId format
    if (!req.body.sessionId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(req.body.sessionId)) {
      appLogger.error('Invalid or missing sessionId in events endpoint', createLogMetadata(req, { 
        providedId: req.body.sessionId
      }));
      return res.status(400).json({ success: false, message: 'Invalid or missing sessionId' });
    }
    
    // Validate events array
    if (!Array.isArray(req.body.events)) {
      appLogger.error('Events must be an array', createLogMetadata(req, { 
        eventsType: typeof req.body.events
      }));
      return res.status(400).json({ success: false, message: 'Events must be an array' });
    }
    
    // Sanitize events to handle any problematic data
    const sanitizedEvents = req.body.events.map(event => {
      if (!event) return null;
      
      try {
        return {
          eventType: event.eventType ? String(event.eventType).substring(0, 50) : 'unknown',
          area: event.area ? String(event.area).substring(0, 50) : 'unknown',
          timestamp: event.timestamp || new Date().toISOString(),
          data: event.data || {}
        };
      } catch (err) {
        appLogger.warn('Error sanitizing event, skipping', createLogMetadata(req, {
          error: err.message || 'Unknown error'
        }));
        return null;
      }
    }).filter(Boolean);
`
);

// Save the updated file
console.log('Saving updated analytics routes file...');
fs.writeFileSync(routesPath, updatedContent);
console.log('Analytics fix applied successfully!');

// Instructions
console.log('\nINSTRUCTIONS:');
console.log('1. Restart the server to apply the changes');
console.log('2. Test the analytics functionality');
console.log('3. If there are any issues, restore the backup file:');
console.log(`   cp ${backupPath} ${routesPath}`);
