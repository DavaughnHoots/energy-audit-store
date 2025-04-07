# Property Settings Rework Implementation Plan

## Overview

This implementation plan addresses the following issues with the current Property Settings:

1. **Intrusiveness:** Users must fill in Property Settings before viewing the dashboard
2. **Navigation Issues:** Problems switching between general and property settings
3. **Poor Integration:** Property Settings accessed via separate page rather than dashboard
4. **Unclear Labeling:** Confusion between Property Settings and User Settings

## Implementation Checklist

### Phase 1: Auto-populate Property Settings with Audit Defaults ✅

- [x] **1.1 Update User Profile Service**
  - [x] Modify `src/services/userProfileService.enhanced.ts` to ensure Property Settings auto-populate with defaults
  - [x] Add fallback logic to use audit decisions when property settings are empty 
  - [x] Add logging for debugging property settings population

- [x] **1.2 Update Audit to Settings Data Flow**
  - [x] Create a utility function that extracts relevant data from completed audits
  - [x] Enhance data mapping to properly preserve defaults when users first access dashboard
  - [x] Add validation to ensure default values are reasonable

- [x] **1.3 Fix Default Population Logic**
  - [x] Add checks to prevent overwriting user-defined settings with defaults
  - [x] Add logging for debugging default population
  - [x] Create data normalization utility for consistent property data formats

### Phase 2: Add Property Settings Tab to Dashboard2

- [ ] **2.1 Create Dashboard Property Settings Component**
  - [ ] Create `src/components/dashboard2/PropertySettingsTab.tsx` component
  - [ ] Reuse existing property settings form elements
  - [ ] Enhance UI to fit dashboard layout/styling

- [ ] **2.2 Modify Dashboard Layout**
  - [ ] Update `src/components/dashboard2/SimpleDashboardLayout.tsx` to add Property Settings tab
  - [ ] Add tab navigation logic
  - [ ] Ensure tab state is preserved when navigating

- [ ] **2.3 Update Dashboard Index Exports**
  - [ ] Add new Property Settings tab component to `src/components/dashboard2/index.ts`
  - [ ] Update any relevant typings

- [ ] **2.4 Integrate Property Settings Data Flow**
  - [ ] Ensure dashboard can fetch and update property settings
  - [ ] Add loading/error states for property settings tab
  - [ ] Add success messaging for settings updates

### Phase 3: Update Navigation and Button Names

- [ ] **3.1 Update User Dashboard Page**
  - [ ] Rename "Property Settings" button to "User Settings" in `src/pages/UserDashboardPage.tsx`
  - [ ] Update navigation to point to `/settings` instead of `/settings/property`
  - [ ] Add clear labeling to differentiate settings types

- [ ] **3.2 Update Links Throughout Application**
  - [ ] Find and update all links that point to `/settings/property`
  - [ ] Update button and link text for clarity
  - [ ] Fix any broken navigation paths

- [ ] **3.3 Update Settings Page Default Tab**
  - [ ] Modify `UserSettingsPage.tsx` to default to General tab
  - [ ] Add clear visual distinction between tabs

### Phase 4: Modify Settings Page Route Behavior

- [ ] **4.1 Update App.tsx Routes**
  - [ ] Modify `/settings/property` route behavior in `src/App.tsx`
  - [ ] Update routing to load correct default tab
  - [ ] Consider adding redirects for cleanliness 

- [ ] **4.2 Update User Settings Page Component**
  - [ ] Modify `src/pages/UserSettingsPage.tsx` to show only General settings
  - [ ] Remove property settings tab but preserve data/functionality
  - [ ] Add UX improvements to make navigation intuitive

- [ ] **4.3 Fix Component Visibility Logic**
  - [ ] Update conditional rendering in settings components
  - [ ] Fix any issues with component state when switching tabs
  - [ ] Ensure clean UX with loading states

### Phase 5: Testing and Documentation

- [ ] **5.1 Perform Integration Testing**
  - [ ] Test all navigation flows between dashboard and settings
  - [ ] Verify default population works correctly with new audits
  - [ ] Test edge cases (new users, users with missing data)

- [ ] **5.2 Update Documentation**
  - [ ] Update relevant documentation in energy-audit-vault
  - [ ] Document new property settings data flow
  - [ ] Add comments to complex logic sections

- [ ] **5.3 Prepare Deployment Script**
  - [ ] Create deployment script for these changes
  - [ ] Test deployment in staging environment
  - [ ] Prepare rollback plan if needed

## Development Approach

### First Pass: Core Structure

Begin with the dashboard integration and default population logic to address the most critical user experience issues:

1. Implement property settings tab on dashboard
2. Fix default population logic
3. Update navigation labels and routes

### Second Pass: Polish and UX

After core functionality is working:

1. Refine UI/UX of property settings components
2. Improve error handling and validation
3. Add helpful tooltips and user guidance

### Third Pass: Testing and Optimization

Final phase to ensure quality:

1. Create comprehensive test suite
2. Optimize data fetching and state management
3. Perform UX testing to verify improved flows

## Deployment Strategy

1. Deploy changes in a single release to prevent navigation/routing issues
2. Schedule deployment during low-traffic period
3. Add feature flag to enable rollback if needed
4. Monitor analytics after deployment to verify improvements

## Documentation Updates

- [ ] Update user documentation to reflect new navigation
- [ ] Add developer documentation about new data flow
- [ ] Update API documentation for any endpoint changes
