# Granular Analytics Events Implementation Plan

## Overview

This document outlines the plan to enhance the analytics tracking system for the Energy Audit application by implementing more granular feature-specific event naming. While our previous implementation successfully captures basic analytics data, the current dashboard only displays generic component names (e.g., "ProductsPage", "EnergyAuditForm") rather than specific features being used, limiting the insights that can be derived from the data.

## Current Issues

1. **Limited Feature Specificity**: The admin dashboard shows generic component names like "ProductsPage" instead of specific features like "ProductsPage_Search" or "ProductsPage_CategoryFilter"
2. **Difficult Feature Usage Analysis**: Cannot easily determine which specific features within a page are most frequently used
3. **Aggregation Limitations**: All interactions with a component are grouped together, regardless of the specific feature being used

## Implementation Goals

1. Implement a more granular naming convention for component interaction events
2. Update existing components to use this new naming convention
3. Ensure dashboard properly displays these more granular feature names
4. Maintain backward compatibility with existing analytics infrastructure

## Naming Convention

We will adopt the following naming convention for component events:

```
[ComponentName]_[FeatureAction]
```

Examples:
- `ProductsPage_Search` instead of just `ProductsPage`
- `ProductsPage_CategoryFilter` instead of `ProductsPage`
- `EnergyAuditForm_Navigation` instead of `EnergyAuditForm`

## Implementation Checklist

### 1. Update Component Tracking Hooks

- [x] Review and update `useComponentTracking` hook to better support feature-specific naming
- [x] Add documentation for the new naming convention
- [x] Ensure console logging clearly identifies the feature being tracked

### 2. Update ProductsPage Tracking

- [x] Replace generic "ProductsPage" component name with feature-specific names:
  - [x] `ProductsPage_Search` for search box interactions
  - [x] `ProductsPage_CategoryFilter` for main category filter changes
  - [x] `ProductsPage_SubcategoryFilter` for subcategory filter changes
  - [x] `ProductsPage_Pagination` for pagination controls
  - [x] `ProductsPage_Sorting` for sort order changes
  - [x] `ProductsPage_ProductCard` for product card interactions

### 3. Update EnergyAuditForm Tracking

- [x] Replace generic "EnergyAuditForm" component name with feature-specific names:
  - [x] `EnergyAuditForm_Navigation` for step navigation
  - [x] `EnergyAuditForm_BasicInfo` for basic info form interactions
  - [x] `EnergyAuditForm_HomeDetails` for home details form interactions
  - [x] `EnergyAuditForm_CurrentConditions` for current conditions form interactions
  - [x] `EnergyAuditForm_HeatingCooling` for HVAC form interactions
  - [x] `EnergyAuditForm_EnergyUsage` for energy usage form interactions
  - [x] `EnergyAuditForm_AdvancedOptions` for advanced options interactions
  - [x] `EnergyAuditForm_Submission` for form submission actions

### 4. Update Other Key Components

- [x] Review and update other components based on the new naming convention
- [x] Focus on high-traffic pages and interactive components first
- [x] Document all the new feature names for future reference

### 5. Backend Processing Updates

- [ ] Verify backend correctly processes the new feature names
- [ ] ~~Ensure the admin dashboard correctly displays the more granular feature names~~ (See Dashboard Update section below)
- [ ] Update any aggregation logic to properly group by these new feature names

### 6. Testing and Verification

- [x] Test each component to verify proper event naming
- [ ] Check admin dashboard to ensure new feature names appear correctly
- [ ] Verify event counts in analytics database match expected values

### 7. Dashboard Update Strategy - NEW

After implementing the granular analytics tracking, we observed that the main admin dashboard continues to show the generic component names. Rather than modifying the existing dashboard and risking breaking its functionality, we've decided to:

- [ ] Add a new "Granular Analytics Visualization" section to the debugging tools area of the admin dashboard
- [ ] Create a new backend endpoint specifically for querying granular analytics data
- [ ] Develop a specialized view that properly displays and groups the detailed feature names
- [ ] Maintain the existing dashboard view for backward compatibility

## New Implementation Tasks

### 1. Create New Backend Endpoint

- [ ] Add a `/api/direct-admin/granular-analytics` endpoint to `direct-admin.ts`
- [ ] Query analytics_events with a focus on the featureName field
- [ ] Specifically look for componentNames containing underscores (e.g., "EnergyAuditForm_Navigation")
- [ ] Group results by base component and feature

### 2. Update AdminDashboardPage.tsx

- [ ] Add a new "Granular Analytics Tracking" section under the "Debugging Tools" area
- [ ] Create a function to fetch data from the new endpoint
- [ ] Display results grouped by base component name
- [ ] Show individual feature usages within each component group

### 3. Implement Visualization

- [ ] Create a collapsible view for each component group
- [ ] Use color-coding to distinguish different feature types
- [ ] Include usage counts and percentages for each feature
- [ ] Apply the same date filtering as the main dashboard

## Example Implementation Changes

### Example 1: ProductsPage Search Box

**Current Implementation:**
```typescript
trackComponentEvent('ProductsPage', 'search_box_input', { query });
```

**New Implementation:**
```typescript
trackComponentEvent('ProductsPage_Search', 'input', { query });
```

### Example 2: Category Filter

**Current Implementation:**
```typescript
trackComponentEvent('ProductsPage', 'filter_mainCategory', { category });
```

**New Implementation:**
```typescript
trackComponentEvent('ProductsPage_CategoryFilter', 'change', { category });
```

### Example 3: EnergyAuditForm Navigation

**Current Implementation:**
```typescript
trackComponentEvent('EnergyAuditForm', 'navigation_next', { fromStep, toStep });
```

**New Implementation:**
```typescript
trackComponentEvent('EnergyAuditForm_Navigation', 'next', { fromStep, toStep });
```

## Benefits

1. **More Detailed Analytics**: The admin dashboard will show which specific features are being used most frequently
2. **Better Prioritization**: Development efforts can be focused on improving the most-used features
3. **Improved UX Insights**: Understand how users interact with specific features rather than just pages
4. **Enhanced Debugging**: Easier to trace analytics events to specific features
5. **Granular A/B Testing**: Test changes to specific features and measure impact

## Implementation Approach

1. Create a new branch for the implementation
2. Update the core tracking hooks and utilities
3. Modify ProductsPage and EnergyAuditForm components
4. Test locally to verify proper event tracking
5. Push changes to Git
6. Deploy directly to Heroku
7. Verify changes in production environment

## Success Criteria

1. Admin dashboard maintains existing functionality without disruption
2. New granular analytics section in debugging tools shows specific feature names
3. Each feature has its own count and is properly grouped by component
4. All analytics events maintain backward compatibility with existing systems
5. No regression in functionality or performance
