# Dashboard & Reports Chart Financial Data Fix

## Problem Statement
1. The Savings Analysis chart in Reports shows $1 for all recommendation bars, despite recommendations having correct financial data ($50/year, $520/year, $63/year, etc.) in the UI display.
2. Browser logs indicate "hasFinancialData: false" and "totalEstimatedSavings: 0" despite visible financial values.
3. Our fallback logic correctly adds a $1 visual offset, but it shouldn't be necessary when actual data exists.

## Root Causes Identified
1. **Data Transformation Issue**: Financial data from recommendations is not being properly transformed into chart data format.
2. The `prepareSavingsAnalysisData()` function in `ReportGenerationService.ts` is not extracting the proper financial values.
3. The logs confirm "All savings values are zero, adding visual offset" - indicating the chart is receiving zero values.

## Implementation Plan

### 1. Fix Backend Report Data Preparation
- Modify `ReportGenerationService.ts` to ensure financial data is properly mapped from recommendations to chart data
- Add debug logging to trace financial data flow through the transformation process
- Fix any data structure mismatches between the recommendation display and chart format

### 2. Update Frontend Chart Component
- Ensure the chart component can handle and properly display real financial values
- Modify the visual offset logic to keep a reasonable scale when mixing large and small values
- Add more detailed debugging to validate data at each transformation step

### 3. Update Data Flow Process
- Ensure recommendations' financial data is consistently represented throughout the application
- Fix serialization/deserialization issues if present
- Address any missing property mappings in type definitions

## Verification Steps
1. Verify that Savings Analysis chart shows actual financial values ($50, $520, $63) instead of $1
2. Ensure chart Y-axis scales appropriately to the different values
3. Confirm the correct financial data flows all the way from database to UI

## Technical Approach
- Focus on the specific data transformation in `prepareSavingsAnalysisData()` 
- Add detailed logging to track financial values at each step
- Ensure consistent property naming across the codebase
