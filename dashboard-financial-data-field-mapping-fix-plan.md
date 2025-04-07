# Dashboard Financial Data Field Mapping Fix

## Problem Statement
The dashboard charts and recommendation cards are showing $0 values for financial data (savings, costs, payback periods), despite the interactive report showing the correct financial values:
- Dashboard shows "$0/year" values while Interactive Report shows "$520/year", "$50/year", "$63/year", etc.
- Savings Analysis charts in the dashboard display tiny 1px bars as "visual offset" fallback instead of actual values
- Browser logs indicate "All savings values are zero, adding visual offset" despite correct data being available

## Root Cause Identified
1. **Field Mapping Issue**: The data transformation in `UserDashboardPage.tsx` doesn't correctly map financial fields from report API response to dashboard display format.
2. **Field Name Mismatch**: The code expects flat numeric values in fields like `estimatedSavings`, but actual data in the API uses structures like `savingsPerYear` or has format strings with units.
3. **Zero Value Handling**: When financial values are missing due to incorrect mapping, the fallback logic adds a visual offset (tiny 1px bars) for better UI presentation.

## Technical Analysis
```typescript
// In UserDashboardPage.tsx, current mapping incorrectly handles financial data:
enhancedRecommendations: reportData.recommendations?.map(rec => ({
  ...rec,
  // This mapping doesn't match the actual field structure in the API response
  estimatedSavings: rec.estimatedSavings || 0,  
  actualSavings: rec.actualSavings || 0,
  estimatedCost: rec.estimatedCost || 0,
  implementationCost: rec.implementationCost || 0
})) || [],
```

## Implementation Plan

### 1. Update Data Transformation in UserDashboardPage.tsx
- Add debug logging to inspect the exact structure of financial fields in API response
- Update the property mapping to handle multiple potential field names and formats:
  ```typescript
  enhancedRecommendations: reportData.recommendations?.map(rec => {
    // Debug actual object structure
    console.log('Recommendation financial fields:', {
      title: rec.title,
      fieldKeys: Object.keys(rec),
      estimatedSavings: rec.estimatedSavings,
      annualSavings: rec.annualSavings,
      savingsPerYear: rec.savingsPerYear,
      estimatedCost: rec.estimatedCost,
      implementationCost: rec.implementationCost,
      cost: rec.cost
    });
    
    return {
      ...rec,
      // Try multiple possible field names with fallbacks
      estimatedSavings: parseFloat(rec.annualSavings || rec.savingsPerYear || rec.estimatedSavings || 0),
      actualSavings: parseFloat(rec.actualSavings || 0),
      estimatedCost: parseFloat(rec.implementationCost || rec.cost || rec.estimatedCost || 0),
      paybackPeriod: parseFloat(rec.paybackPeriod || 0)
    };
  }) || [],
  ```

### 2. Enhance Validation and Logging
- Add validation to ensure financial values are correctly parsed as numbers
- Add logging to compare recommended values before and after transformation
- Track the data flow from API response → transformation → chart rendering

### 3. Add Error Handling
- Add graceful error handling for missing or malformed financial data
- Implement better validation before adding "visual offset" fallback

## Testing & Verification
1. Check browser logs to confirm proper field values are being extracted
2. Verify the dashboard charts show actual financial values ($50, $520, $63) instead of $1 placeholders
3. Ensure chart Y-axis scales appropriately to the different values
4. Confirm consistent financial data representation between interactive report and dashboard

## Dependencies
- `UserDashboardPage.tsx` - Main data transformation logic
- `DashboardEnergyAnalysis.tsx` - Chart rendering and visual offset fallback logic
- `ReportGenerationService.ts` - Source of chart data in API response

## Implementation Approach
1. First identify and log the exact structure of the API response with a debug deployment
2. Make targeted change to the data transformation in `UserDashboardPage.tsx`
3. Verify with log output that financial values are correctly mapped
4. Deploy changes to production
