# Dashboard Unified Approach Implementation Plan

## Overview

The current dashboard recommendations system has several issues:
1. Different designs between reports and dashboard
2. Inconsistent financial data between views 
3. Multiple competing implementations causing conflicts
4. Complex data merging logic causing bugs

To solve this, we've created a new, clean dashboard implementation that strictly reuses the components from the reports system.

## Implementation Strategy

### Step 1: Create New Components

We've created a new set of components in `src/components/dashboard2/`:

1. **SimpleDashboardLayout.tsx** - A clean, simple dashboard layout
2. **RecommendationsList.tsx** - Directly uses the same UnifiedRecommendations component as reports
3. **SummaryStats.tsx** - Shows high-level statistics 
4. **ChartSection.tsx** - Clean chart implementation using the same data format

### Step 2: Create New Dashboard Page

We've implemented a new dashboard page (`NewUserDashboardPage.tsx`) that:
1. Uses a single data source (the reports API)
2. Has a simplified data flow (no complex merging)
3. Avoids the bugs present in the existing implementation
4. Ensures consistency with the reports view by using the same components

### Step 3: Mark Old Components as Deprecated

All old dashboard components have been marked with `@deprecated` JSDoc tags:
- EnhancedDashboardRecommendations
- DashboardEnergyAnalysis
- etc.

### Step 4: Parallel Deployment

We've added a new route (`/dashboard2`) to allow side-by-side comparison with the old dashboard, enabling gradual transition without disrupting users.

## Benefits

- **Simplified Architecture**: Single source of truth for all recommendations
- **Consistent UX**: Same design across dashboard and reports
- **Reliable Data**: Consistent financial values between views
- **Maintainability**: Cleaner code with less duplication
- **Future Extensions**: Easier to add new features to a clean implementation

## Next Steps

1. Gather user feedback on the new dashboard implementation
2. Add any missing features from old dashboard to new one
3. Gradually migrate users to the new version
4. Once fully migrated, remove old dashboard code
