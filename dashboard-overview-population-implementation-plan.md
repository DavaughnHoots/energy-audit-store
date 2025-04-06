# Dashboard Overview Population Implementation Plan

## Overview
The Dashboard Overview tab currently has two sections that are not being populated:
1. **Energy Analysis section** - Shows charts for energy breakdown, consumption, and savings
2. **Recommendations section** - Shows actionable recommendations for energy improvements

This implementation plan details how we'll populate these sections by leveraging existing data from the user's audit reports.

## Problem Statement
When users visit their dashboard, they see empty sections with "No data available" messages in both the Energy Analysis and Recommendations sections, even though they may have completed audits with recommendations.

## Solution Approach

### 1. Recommendations Section Implementation

#### 1.1 Data Collection Strategy
- Scan through all of a user's audits
- Group recommendations by type (lighting, HVAC, insulation, etc.)
- Select the most recent recommendation for each type
- Include all relevant metadata (priority, savings estimates, etc.)

#### 1.2 Backend Changes Required
- Modify `backend/src/routes/dashboard.enhanced.ts` to:
  - Fetch all audit reports for the user
  - Extract all recommendations and group by unique types
  - For each type, select the most recent recommendation
  - Format the data for consumption by the frontend component

#### 1.3 Sorting Strategy
- Primary sort: By priority (high → medium → low)
- Secondary sort: By estimated savings (highest first)
- This ensures the most impactful recommendations appear first

### 2. Energy Analysis Section Implementation

#### 2.1 Data Collection Strategy
- Energy breakdown data: Use data from the most recent audit
- Consumption data: Use data from the most recent audit
- Savings analysis data: Aggregate from all audits that have implemented recommendations

#### 2.2 Backend Changes Required
- Enhance the same endpoint to collect energy analysis data
- Create proper data structures for the charts:
  - Energy breakdown: Pie chart showing distribution of energy use
  - Energy consumption: Bar chart showing consumption by category
  - Savings analysis: Bar chart comparing estimated vs. actual savings

### 3. Implementation Steps

#### Phase 1: Backend Enhancement
1. Modify `backend/src/services/dashboardService.enhanced.ts` to:
   - Add new functions to collect recommendations by type
   - Add new functions to collect and format energy analysis data
   - Ensure proper error handling and fallbacks

2. Update `backend/src/routes/dashboard.enhanced.ts` to:
   - Call the new service functions
   - Include the enhanced data in the response

#### Phase 2: Frontend Verification
1. Verify that the existing components can handle the new data structure
2. Make any necessary adjustments to:
   - `src/components/dashboard/EnhancedDashboardRecommendations.tsx`
   - `src/components/dashboard/DashboardEnergyAnalysis.tsx`

#### Phase 3: Deployment
1. Create deployment script
2. Test in development environment
3. Deploy to production

## Expected Results
- The Dashboard Overview tab will show personalized energy analysis charts
- The Recommendations section will show a diverse set of recommendations covering all improvement types
- Users will have a more informative dashboard experience with actionable insights

## Success Metrics
- Dashboard shows properly populated charts in the Energy Analysis section
- Recommendations section displays one unique recommendation per type
- All data is properly formatted and displayed in the UI
