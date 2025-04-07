# Dashboard Infinite Loop Fix Implementation Plan

## Issue Summary

After implementing the dashboard data integration with the report API, we've observed two key issues:

1. **Infinite API Calls**: The browser is making non-stop API calls to fetch data from the report API.
2. **Data Processing Issues**: While the data is being fetched correctly (charts and recommendations), the financial values are being processed incorrectly, causing charts to display sample/default data.

## Root Causes

### 1. Infinite API Calls Loop

The infinite loop is happening because:
- The `fetchAuditSpecificData` function includes `stats` in its dependency array
- When we update stats with `setStats(dashboardData)`, it triggers a re-creation of the function
- This causes another API call, which updates stats again, and the cycle continues

### 2. Data Processing Issues

The data transformation between report format and dashboard format is incorrect:
- The log shows `All savings values are zero, adding visual offset`
- This indicates that actual financial values are being lost or zeroed out in the transformation
- Proper field mapping is needed to ensure financial data appears in charts

## Implementation Plan

### 1. Fix Infinite API Calls Loop

- Remove `stats` from the dependency array of `fetchAuditSpecificData`
- Use a functional update pattern for `setStats` to avoid dependency issues
- Add a loading ref to track if we're already fetching data to prevent duplicate requests

```typescript
// Add a loading ref at component level
const isLoadingRef = useRef(false);

// Fix infinite loop by removing stats dependency
const fetchAuditSpecificData = useCallback(async (auditId: string) => {
  // Prevent duplicate requests
  if (isLoadingRef.current) return;
  isLoadingRef.current = true;
  
  try {
    console.log('Fetching audit-specific data using report API for audit:', auditId);
    
    // Use the report data API instead of dashboard API
    const reportData = await fetchReportData(auditId);
    
    // Transform data and update state using functional update to avoid dependency issues
    setStats(prevStats => ({
      ...prevStats,
      energyAnalysis: reportData.charts,
      enhancedRecommendations: reportData.recommendations,
      dataSummary: {
        hasDetailedData: true,
        isUsingDefaultData: false,
        dataSource: 'detailed',
        auditId: auditId
      },
      lastUpdated: new Date().toISOString(),
      specificAuditId: auditId
    }));
    
  } catch (err) {
    console.error('Error fetching report data for dashboard:', err);
    // Fallback logic...
  } finally {
    isLoadingRef.current = false;
  }
}, [/* dependencies without stats */]);
```

### 2. Fix Data Processing

- Ensure proper mapping of financial values from report format to dashboard format
- Preserve original values rather than zeroing them out
- Enhance data transformation to ensure correct field mapping for visualization

```typescript
// Example of enhanced data transformation
const dashboardData = {
  ...prevStats,
  // Properly map chart data with correct financial values
  energyAnalysis: {
    energyBreakdown: reportData.charts?.energyBreakdown || [],
    consumption: reportData.charts?.consumption || [],
    savingsAnalysis: reportData.charts?.savingsAnalysis || []
  },
  // Preserve financial data in recommendations
  enhancedRecommendations: reportData.recommendations.map(rec => ({
    ...rec,
    // Ensure financial values are preserved
    estimatedSavings: rec.estimatedSavings || 0,
    actualSavings: rec.actualSavings || 0,
    estimatedCost: rec.estimatedCost || 0,
    implementationCost: rec.implementationCost || 0
  })),
  // Update metadata
  dataSummary: {
    hasDetailedData: true,
    isUsingDefaultData: false,
    dataSource: 'detailed',
    auditId: auditId
  }
};
```

## Testing Plan

1. **Verify API Calls**: Monitor browser network tab to ensure only a single API call is made per audit
2. **Verify Charts Display**: Confirm charts show actual data with non-zero values where available
3. **Verify Recommendations**: Ensure all recommendations are displayed with correct financial information
4. **Verify Browser Performance**: Confirm browser performance is improved without the infinite loop

## Deployment Timeline

1. Code Changes: 1 hour
2. Testing: 1 hour
3. Deployment to Production: 30 minutes

Total: 2.5 hours
