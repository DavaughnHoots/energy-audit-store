# Analytics Tracking and Diagnostics Implementation Plan

## Overview

This document outlines a comprehensive plan to enhance the analytics tracking system for the Energy Audit application. The plan addresses several key issues identified through diagnostic testing:

1. **Missing or Improper Page View Events**: Some pages aren't tracking page views properly, resulting in incomplete analytics data.
2. **Limited Component Interaction Logging**: Component interactions aren't being properly logged to console, only visible when duplicate events are detected.
3. **Incorrect Page Names in Dashboard**: The admin dashboard shows "Energy Efficient Shop" instead of actual page names in the "Most Visited Pages" section.
4. **Missing Feature Names in Dashboard**: The "Most Used Features" section shows "unknown" instead of proper feature names.

## Implementation Checklist

### 1. Page Tracking Improvements

- [x] **Audit Current State**
  - [x] Identify all page components in the application
  - [x] Check which pages already implement `usePageTracking`
  - [x] Create list of pages missing tracking

- [x] **Add `usePageTracking` Hook to Pages**
  - [x] Add to CommunityPage (`usePageTracking('community')`)
  - [x] Add to EducationPage (`usePageTracking('education')`)
  - [x] Add to UserSettingsPage (`usePageTracking('settings')`)
  - [ ] Add to InteractiveReportPage (`usePageTracking('reports')`)
  - [ ] Verify UserDashboardPage tracking is working (`usePageTracking('dashboard')`)
  - [ ] Add to ProductsPage (`usePageTracking('products')`)
  - [ ] Add to EnergyAuditPage (`usePageTracking('energy_audit')`)
  - [ ] Add to any other missing page components

- [x] **Enhance Page Name Normalization** *(UPDATED)*
  - [x] Audit how page names are stored in the database
  - [x] Create consistent path-to-name mapping mechanism
  - [x] Ensure page identifiers match between tracking and dashboard display
  - [x] Add descriptive page titles to all page tracking calls

### 2. Component Tracking Implementation

- [x] **Identify Key Interactive Components**
  - [x] List all interactive components that should be tracked
  - [x] Prioritize high-value components for tracking

- [x] **Add `useComponentTracking` Hooks**
  - [x] Add to navigation components
  - [x] Add to interactive cards/panels
  - [x] Add to tabs and tab panels
  - [x] Add to buttons in high-traffic areas
  - [x] Add to modal dialogs and overlays
  - [ ] Add to ProductsPage search, filters, and pagination
  - [ ] Add to EnergyAuditForm navigation and submission buttons

- [x] **Add Enhanced Component Interaction Logging** *(UPDATED)*
  - [x] Add explicit console logging to component tracking hooks
  - [x] Ensure component interactions are logged with the same detail as page views
  - [x] Include descriptive feature names in all component tracking events
  - [x] Add tracing for component tracking call stack

- [x] **Audit Component Name Consistency** *(UPDATED)*
  - [x] Create standardized naming convention for component interactions
  - [x] Review all component tracking implementations for proper naming
  - [x] Create mapping between internal IDs and user-friendly display names
  - [x] Update all component tracking calls with descriptive names

### 3. Analytics Context and Data Pipeline Fixes

- [x] **Enhance Analytics Context Logging** *(UPDATED)*
  - [x] Add consistent console logging for all event types
  - [x] Log every tracking attempt with full details
  - [x] Add more detailed information about event deduplication
  - [x] Create debug helper functions for analytics logging

- [x] **Fix Event Data Storage Format** *(UPDATED)*
  - [x] Audit database schema for analytics events
  - [x] Ensure proper storage of page names and feature identifiers
  - [x] Add normalization functions for event data
  - [x] Create validation checks for critical event fields

- [x] **Dashboard Data Retrieval Fix** *(UPDATED)*
  - [x] Update SQL queries used to populate dashboard components
  - [x] Ensure proper mapping between stored data and display labels
  - [x] Add fallback display names for missing/unknown values
  - [x] Implement data validation before dashboard display

### 4. Enhanced Admin Dashboard Diagnostics

- [x] **Expand Debugging Tools Section**
  - [x] Create analytics debugger component
  - [x] Add analytics diagnostic page
  - [x] Create debug deployment process
  - [x] Implement console logging enhancements

- [x] **Analytics Monitoring Tools** *(UPDATED)*
  - [x] Create real-time event monitoring view
  - [x] Add detailed event breakdown by type and area
  - [x] Implement direct database query tools
  - [x] Add data export functionality

- [ ] **Analytics Data Visualization Tools** *(NEW)*
  - [ ] Create event flow diagram
  - [ ] Add time-based event distribution charts
  - [ ] Show path analysis for user journeys
  - [ ] Implement component interaction heatmaps

### 5. Backend Enhancements

- [x] **Analytics API Improvements**
  - [x] Fix page name normalization in API endpoints
  - [x] Add proper feature name extraction logic
  - [x] Enhance error handling and reporting
  - [x] Add input validation for analytics events

- [x] **SQL Query Optimization**
  - [x] Fix queries that retrieve page names for dashboard
  - [x] Update feature name extraction queries
  - [x] Add proper grouping and aggregation
  - [x] Implement better null/unknown value handling

- [x] **Diagnostic Endpoints**
  - [x] Create endpoint for raw event queries
  - [x] Add endpoint for hook status checking
  - [x] Create endpoint for admin diagnostics

### 6. Testing and Verification

- [ ] **Test Scenarios** *(NEW)*
  - [ ] Create test script for page navigation tracking
  - [ ] Develop component interaction test scenarios
  - [ ] Create form submission test cases
  - [ ] Document expected events for each user action

- [ ] **Verification Tools** *(NEW)*
  - [ ] Create automated verification scripts
  - [ ] Add database schema validation
  - [ ] Implement analytics integrity checks
  - [ ] Create dashboard data verification tools

- [ ] **Production Verification**
  - [ ] Verify events are recording with proper names
  - [ ] Check dashboard is displaying correct page names
  - [ ] Verify feature names are showing properly
  - [ ] Monitor console for expected logging

## Current Sprint Focus: Products and Energy Audit Pages

### ProductsPage Implementation

- [ ] **Page View Tracking**
  - [ ] Add `usePageTracking` hook to the main component with area 'products'
  - [ ] Verify page views appear correctly in admin dashboard

- [ ] **Component Interaction Tracking**
  - [ ] Track search box interactions (`search_box_input`)
  - [ ] Track category filter changes (`filter_mainCategory`)
  - [ ] Track sub-category filter changes (`filter_subCategory`)
  - [ ] Track pagination controls (`pagination_click`)

- [ ] **Detailed Event Context**
  - [ ] Ensure search context includes query text
  - [ ] Add selected values to filter events
  - [ ] Include page numbers in pagination events

### EnergyAuditPage Implementation

- [ ] **Page View Tracking**
  - [ ] Add `usePageTracking` hook to the main component with area 'energy_audit'
  - [ ] Verify page views appear correctly in admin dashboard

- [ ] **Form Navigation Tracking**
  - [ ] Track step navigation with `navigation_next` and `navigation_previous` events
  - [ ] Add section identifiers to form navigation events
  - [ ] Track time spent on each section where possible

- [ ] **Advanced Options Tracking**
  - [ ] Track advanced options toggle event (`advanced_options_toggle`)
  - [ ] Track autofill events (`advanced_options_autofill`)

- [ ] **Form Submission Tracking**
  - [ ] Track initial submission clicks (`submit_audit_click`)
  - [ ] Track successful form submission (`audit_submission_success`)
  - [ ] Include audit ID in successful submission events
  - [ ] Track form validation errors when they occur

## Implementation Approach

We'll use a branch-based development approach following these steps:

1. **Create `analytics-products-audit-tracking` branch** ✅
2. **Develop Code Changes**
   - Implement ProductsPage tracking
   - Implement EnergyAuditPage tracking
   - Test changes locally
3. **Testing and Verification**
   - Verify events appear in console
   - Check admin dashboard shows correct data
4. **Deployment**
   - Create a focused deployment approach
   - Push to Heroku using the direct branch method
5. **Document Results**
   - Update implementation plan with results
   - Verify success criteria are met

## Priority Fixes Based on Diagnostic Results

### Phase 1: Console Logging Enhancements ✅
1. Update the `trackComponentEvent` function in `useComponentTracking` hook to add consistent console logging
2. Add detailed logging in `AnalyticsContext.tsx` for all event types
3. Create standardized logging format across all tracking functions

### Phase 2: Page Name Normalization ✅
1. Fix how page paths are normalized and stored in the database
2. Update the dashboard queries to properly map page identifiers to display names
3. Create consistent mapping between paths and human-readable names

### Phase 3: Feature Name Standardization ✅
1. Implement proper feature naming in all component tracking calls
2. Update how feature names are stored and retrieved from the database
3. Fix the dashboard query that displays the "Most Used Features" section

### Phase 4: Dashboard Data Display ✅
1. Update the admin dashboard to properly display page names
2. Fix the feature name retrieval and display
3. Add fallback display names for edge cases

### Phase 5: Extended Tracking Implementation *(CURRENT)*
1. Add tracking to ProductsPage
2. Add tracking to EnergyAuditPage
3. Integrate with existing analytics system
4. Test and deploy changes

### Phase 6: Verification and Finalization
1. Deploy all fixes to staging environment
2. Complete comprehensive testing of all tracking events
3. Verify dashboard displays correct information
4. Deploy to production environment

## Deliverables Checklist (NEW)

- [x] **Enhanced Console Logging** ✅
  - [x] Update `useComponentTracking.ts` to add explicit console logging
  - [x] Modify `AnalyticsContext.tsx` to log all event types
  - [x] Add debug mode toggle for verbose logging
  - [x] Create standardized log format for all analytics events

- [x] **Page Name Normalization** ✅
  - [x] Audit page tracking implementation for consistent naming
  - [x] Create mapping utility for path-to-name conversion
  - [x] Update database queries to properly extract page names
  - [x] Fix admin dashboard to display correct page names

- [x] **Feature Name Standardization** ✅
  - [x] Create naming convention for all tracked features
  - [x] Update all component tracking calls with proper names
  - [x] Fix database storage/retrieval of feature names
  - [x] Update admin dashboard to display proper feature names

- [x] **Admin Dashboard Improvements** ✅
  - [x] Fix "Most Visited Pages" component to show actual page names
  - [x] Update "Most Used Features" to display proper feature names
  - [x] Add data validation to prevent unknown/missing names
  - [x] Create detailed analytics visualization section

- [ ] **Products and Energy Audit Page Integration** *(NEW)*
  - [ ] Add page tracking to ProductsPage
  - [ ] Add component tracking to ProductsPage interactions
  - [ ] Add page tracking to EnergyAuditPage
  - [ ] Add form and component tracking to EnergyAuditForm

- [ ] **Documentation and Testing**
  - [ ] Update analytics tracking documentation with naming conventions
  - [ ] Create test cases for all critical events
  - [ ] Document expected console output for key interactions
  - [ ] Create comprehensive analytics testing guide

## Troubleshooting Strategy

1. Use the enhanced diagnostics to identify missing events
2. Check for console errors related to analytics
3. Verify API endpoints are receiving and processing events with proper names
4. Confirm database is storing event data with correct identifiers
5. Check dashboard queries are properly mapping stored data to display names
