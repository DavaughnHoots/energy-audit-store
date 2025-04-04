---
title: "Analytics Direct Fix Implementation"
type: "Documentation"
path: "operations/analytics_direct_fix"
description: "Guide for directly fixing analytics tables on Heroku"
tags: [operations, deployment, analytics, bugfix, heroku, tables]
status: "up-to-date"
last_verified: "2025-04-04"
---

# Analytics Direct Fix Implementation Guide

## Overview

This document outlines an alternative approach to fix the missing analytics tables issue directly on Heroku. This approach bypasses Git deployment complexities and directly runs a script that creates the necessary analytics tables in the PostgreSQL database.

## Problem Statement

The standard approach of deploying scripts through Git to Heroku was encountering issues:

1. The script in `scripts/` directory wasn't included in the Heroku deployment
2. An attempt to move the script to `backend/src/scripts/` faced Git merge conflicts
3. Local changes to several analytics files made it difficult to push to Heroku

## Solution: Direct Script Execution

To resolve these issues, we've created the following:

1. A standalone script file placed in the backend's scripts directory: 
   - `backend/src/scripts/analytics_fix.js`

2. A batch file to execute the script directly on Heroku:
   - `run-heroku-analytics-direct-fix.bat`

## How It Works

The solution has the following components:

### Backend Script (`backend/src/scripts/analytics_fix.js`)

This script:
- Connects directly to the Heroku PostgreSQL database
- Creates the required analytics tables if they don't exist:
  - `analytics_sessions` - For storing user session data
  - `analytics_events` - For storing individual analytics events
  - `analytics_reports` - For storing aggregated analytics reports
- Creates necessary indexes for performance optimization
- Tests database connectivity
- Verifies tables were created successfully
- Inserts and removes test data to validate write permissions

### Batch File (`run-heroku-analytics-direct-fix.bat`)

This Windows batch file:
- Sets the correct Heroku app name
- Runs the analytics fix script directly on Heroku:
  ```bat
  heroku run "node backend/src/scripts/analytics_fix.js" --app %HEROKU_APP%
  ```
- Provides visual feedback during the process

## Running the Fix

Execute the batch file to run the fix on Heroku:

```bash
./run-heroku-analytics-direct-fix.bat
```

The script will:
1. Test database connection
2. Create analytics tables if they don't exist
3. Verify tables exist in the database
4. Test data insertion capabilities
5. Output success/failure information

## Expected Output

A successful run will show:

```
======================================================
    Energy Audit Analytics Fix Deployment Script
======================================================

Testing database connection...
Database connection successful!

Creating analytics tables if they don't exist...
Creating analytics_sessions table...
Creating analytics_events table...
Creating analytics_reports table...
Creating indexes for analytics tables...
Analytics tables and indexes successfully created!

Verifying analytics tables exist...
Analytics tables exist in the database.

Inserting test data to verify write permissions...
Test data successfully inserted!

Cleaning up test data...
Test data successfully cleaned up!

=============================================
✅ Analytics Fix Deployment Successful! ✅
=============================================
```

## Troubleshooting

If the script fails:

1. **Database Connection Issues**:
   - Verify the DATABASE_URL environment variable on Heroku
   - Check that the Postgres add-on is properly attached to your app

2. **Permission Issues**:
   - Ensure the database user has CREATE TABLE permissions
   - Check if the schema is accessible to the user

3. **Table Creation Failures**:
   - Look for specific PostgreSQL error messages in the output
   - Check for conflicting schema definitions

## Related Documentation

- [Analytics Data Flow](../data_flows/analytics_data_flow.md)
- [Analytics Service Update](../backend/services/analytics_service_update.md)
- [Analytics Fix Deployment](./analytics_fix_deployment.md)
- [Heroku Deployment Guide](./heroku_deployment_guide.md)

## Schema Reference

### analytics_sessions

```sql
CREATE TABLE IF NOT EXISTS analytics_sessions (
  id UUID PRIMARY KEY,
  user_id UUID,
  first_activity TIMESTAMP DEFAULT NOW(),
  last_activity TIMESTAMP DEFAULT NOW()
);
```

### analytics_events

```sql
CREATE TABLE IF NOT EXISTS analytics_events (
  id SERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES analytics_sessions(id),
  event_type VARCHAR(255) NOT NULL,
  area VARCHAR(255) NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### analytics_reports

```sql
CREATE TABLE IF NOT EXISTS analytics_reports (
  id UUID PRIMARY KEY,
  timeframe VARCHAR(50) NOT NULL,
  metrics JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_area ON analytics_events(area);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_user_id ON analytics_sessions(user_id);
