# Dashboard Page Paths Implementation Plan

## Overview

Currently, the "Most Visited Pages" section in our admin dashboard shows only the "area" values (e.g., "test-area") instead of actual page paths. This plan outlines the steps to enhance this feature to display meaningful page paths and titles.

## Technical Background

The issue occurs because:

1. Our analytics system stores page view events with the following structure:
   - `event_type`: 'page_view'
   - `area`: Broad section of the app (products, energy_audit, etc.)
   - `data`: A JSON field containing detailed information including:
     - `path`: The actual URL path ('/products/123', etc.)
     - `title`: The page title
     - `search`: Any query parameters

2. The current query in `direct-admin.ts` only uses the `area` field to group page views, which doesn't provide enough detail to show actual pages.

## Implementation Checklist

### Backend Changes

- [ ] 1. Modify the SQL query in `backend/src/routes/direct-admin.ts` to:
  - [ ] a. Extract the page path from the `data->>'path'` JSON field
  - [ ] b. Extract the page title from the `data->>'title'` JSON field
  - [ ] c. Group by both path and title instead of just area
  - [ ] d. Add fallback handling for missing path/title data

- [ ] 2. Update the response format in `backend/src/routes/direct-admin.ts` to include:
  - [ ] a. Path information
  - [ ] b. Title information (when available)
  - [ ] c. Proper type definitions

### Frontend Changes

- [ ] 3. Update `src/pages/AdminDashboardPage.tsx` to:
  - [ ] a. Handle the updated response format
  - [ ] b. Display page titles with paths as fallback
  - [ ] c. Format the paths for better readability (e.g., '/products/123' → 'Products: Item 123')
  - [ ] d. Update the TypeScript interface for the dashboard data

### Testing

- [ ] 4. Test the implementation:
  - [ ] a. Verify SQL query works by checking server logs
  - [ ] b. Confirm data formatting is correct
  - [ ] c. Test with various date ranges
  - [ ] d. Ensure error handling works properly

### Deployment

- [ ] 5. Deploy the changes:
  - [ ] a. Commit changes to Git
  - [ ] b. Push to Git repository
  - [ ] c. Deploy to Heroku
  - [ ] d. Verify deployment success

## Expected Results

After implementation, the "Most Visited Pages" section should display:
- Page titles instead of just area codes
- Full paths as fallbacks when titles aren't available
- More granular view of user navigation patterns

This improvement will provide administrators with better insights into which specific pages users are accessing most frequently.
