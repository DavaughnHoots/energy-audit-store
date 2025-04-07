---
title: "DashboardDataMerge Utility"
type: "utility"
path: "/src/utils/dashboardDataMerge.ts"
description: "Prevents data loss when fetching from multiple dashboard data sources"
tags: [dashboard, data-preservation, utilities, fixes]
status: "up-to-date"
last_verified: "2025-04-07"
---

# Dashboard Data Merge Utility

## Overview

The Dashboard Data Merge utility solves a critical issue in our application where dashboard recommendations and chart data were being lost during API requests. This utility preserves valuable data by intelligently merging responses from multiple endpoints, ensuring that user recommendations and energy analysis information are never accidentally overwritten.

## Problem Solved

Our dashboard was encountering a data synchronization issue between two endpoints:

1. `/api/dashboard/stats` - Often returned empty recommendations
2. `/api/energy-audit/:auditId/report-data` - Correctly returned recommendations

When both endpoints were called sequentially, whichever one responded last would overwrite the state, potentially replacing data-rich responses with empty ones. This created a race condition where successful recommendation fetches were being overwritten by subsequent API calls.

## Implementation Details

### Core Functions

#### `mergeDashboardData(prevStats, newData)`

This function intelligently combines data from multiple sources:

- Takes the previous state and new data as inputs
- Creates a merged object that preserves the most valuable information from both sources
- Prioritizes preserving recommendations when new data has none but previous state did
- Maintains chart data for energy breakdown, consumption, and savings analysis
- Preserves audit IDs and data source metadata

#### `didOverwriteRecommendations(prevStats, newData)`

A diagnostic function that:

- Detects when new data would overwrite existing recommendations
- Returns a boolean indicating if recommendations would be lost
- Used to log warnings when potential data loss is detected

### Usage in UserDashboardPage

The utility is integrated in two critical locations in `UserDashboardPage.tsx`:

1. In the `fetchDashboardData` function when handling general dashboard stats
2. In the fallback section of `fetchAuditSpecificData` when handling API errors

```typescript
// Update stats using the data merge utility
setStats(prevStats => {
  // Check if we would be overwriting valid recommendation data
  if (didOverwriteRecommendations(prevStats, data)) {
    console.log('WARNING: Would overwrite existing recommendations - preserving previous data');
  }
  
  // Merge the data with existing data, preserving valuable information
  const mergedData = mergeDashboardData(prevStats, data);
  
  // Update persisted storage with merged data
  setPersistentStats(mergedData);
  
  return mergedData;
});
```

## Benefits

1. **Data Continuity**: Users no longer lose recommendation data during navigation
2. **Consistent UI**: Dashboard components maintain their state between API calls
3. **Improved Reliability**: Chart data persists even if an endpoint occasionally fails
4. **Debug Support**: Logs warnings when potential data loss is detected
5. **Graceful Degradation**: Dashboard remains functional even when some API data is missing

## Dependencies / Imports

The utility is standalone with no external dependencies, making it robust and easily maintainable.

## Related Files

- [[UserDashboardPage]]: Uses the data merge utility when fetching dashboard data
- [[DefaultFinancialValuesUtility]]: Works alongside this utility to ensure financial values are properly populated
- [[DashboardEnergyAnalysis]]: Displays the chart data that this utility preserves
- [[EnhancedDashboardRecommendations]]: Shows the recommendations preserved by this utility
