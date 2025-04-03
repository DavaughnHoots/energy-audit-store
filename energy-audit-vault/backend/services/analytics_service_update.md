---
title: "Analytics Service Update"
type: "Backend Service Update"
path: "backend/src/services/AnalyticsService.enhanced.ts"
description: "Fixes and enhancements to the Analytics data collection system"
tags: [analytics, pilot-study, debugging, diagnostics]
status: "up-to-date"
last_verified: "2025-04-03"
---

# Analytics Service Update

## Overview

The Analytics Service has been updated to address critical issues related to data collection and storage. The primary issue was that analytics events were being properly queued on the client side but not appearing in the admin dashboard because the underlying database tables did not exist or were not properly accessible.

## Key Enhancements

### 1. Enhanced Error Handling and Diagnostics

- Added comprehensive error handling with detailed logging
- Implemented a diagnostic system to verify database connectivity and table existence
- Added robust validation for input parameters and event data
- Improved transaction handling with batch processing for events

### 2. Database Connection Validation

- Added connection testing before critical operations
- Implemented automated recovery mechanisms for temporary connection issues
- Detailed error reporting for connection problems

### 3. Table Creation and Verification

- Created migration (20250404_add_analytics_tables.js) to ensure all required tables exist
- Tables created:
  - `analytics_events` - Stores individual analytics events
  - `analytics_sessions` - Tracks user sessions
  - `analytics_consent` - Records user consent status
  - `pilot_tokens` - Manages pilot study invitation tokens

- Created script (run_analytics_tables_migration.js) to:
  - Execute the table creation migration
  - Verify tables were created successfully
  - Report diagnostic information

## Usage

### Running the Migration

To ensure the analytics tables exist in the database:

```bash
# For local development
cd backend
node src/scripts/run_analytics_tables_migration.js

# For Heroku deployment
heroku run node backend/src/scripts/run_analytics_tables_migration.js -a your-heroku-app
```

### Using the Enhanced Service

The enhanced analytics service is a drop-in replacement for the original service:

```typescript
// Import the enhanced service
import { AnalyticsService } from '../services/AnalyticsService.enhanced';

// Create and use as normal
const analyticsService = new AnalyticsService(db.pool);

// New diagnostic capabilities
const diagnostics = await analyticsService.runDiagnostics();
console.log(diagnostics.tablesExist); // Check if tables exist
console.log(diagnostics.counts); // Get record counts
```

## Implementation Details

### Key Methods

- **saveEvents(userId, sessionId, events)**: Saves a batch of analytics events
- **updateSession(sessionId, userId)**: Creates or updates a session record 
- **runDiagnostics()**: Performs comprehensive system checks
- **getMetrics(request)**: Retrieves analytics metrics with enhanced validation

### Error Handling Approach

The enhanced service implements a multi-layered error handling approach:

1. Input validation with detailed error messages
2. Connection testing before database operations
3. Transaction-level error handling
4. Batch processing with per-batch error containment
5. Comprehensive logging with contextual information

## Troubleshooting

If analytics data is still not appearing in the dashboard after the update:

1. Check database connectivity using the `testDatabaseConnection()` method
2. Verify table existence using the `runDiagnostics()` method
3. Examine the detailed logs for specific error messages
4. Verify event queue is properly flushing from the client side
5. Check client-side consent status is properly set

## Related Files

- `backend/src/services/AnalyticsService.enhanced.ts` - Enhanced service implementation
- `backend/src/migrations/20250404_add_analytics_tables.js` - Table creation migration
- `backend/src/scripts/run_analytics_tables_migration.js` - Migration runner script
- `backend/src/routes/analytics.ts` - Analytics API endpoints
- `backend/src/routes/admin.ts` - Admin dashboard endpoints
- `src/context/AnalyticsContext.tsx` - Client-side analytics context
