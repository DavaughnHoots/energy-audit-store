# Dashboard & Reports Recommendations Chart Fix

## Problem Statement
1. In the Reports section, the Energy Analysis chart's Savings Analysis graph shows no values (0) despite recommendations having financial data.
2. The recommendations data is being loaded correctly for the Recommendations tab, but not being used for the charts.
3. Total Estimated Annual Savings on the Summary page needs to be updated with correct totals.

## Root Causes
1. **Chart Data Preparation Issue**: The `prepareSavingsAnalysisData()` function in `ReportGenerationService.ts` is not processing financial data correctly for chart display.
2. **Empty or Zero Values**: The data is being mapped, but potentially with null/undefined values defaulting to 0.
3. **Dependency on Tab Viewing**: Current implementation requires user to navigate to recommendations tab before data is processed.

## Implementation Plan

### 1. Enhance Report Data Generation (Backend)
- Modify `ReportGenerationService.ts` to ensure `prepareSavingsAnalysisData()` correctly transforms recommendation financial data.
- Add validation to prevent zero-value estimates from showing in charts. 
- Ensure proper financial data validation in the `validateRecommendations` method.

### 2. Fix Interactive Report Page (Frontend)
- Update `InteractiveReportPage.tsx` to preprocess recommendations data when the report loads.
- Add console logging to help debug financial data flow.
- Ensure recommendations data is fully loaded before charts component renders.

### 3. Fix Savings Analysis Logic
- Update the calculation methods for total estimated annual savings.
- Add fallback logic in case of missing or invalid financial data.
- Ensure proper aggregation of all recommendations' estimated savings.

## Verification Steps
1. Verify that Savings Analysis chart shows the correct financial data for recommendations.
2. Confirm that chart loads correctly without having to navigate to recommendations tab first.
3. Validate that the Total Estimated Annual Savings reflects the sum of all recommendation savings.

## Technical Approach
- We will be careful to make minimal changes to existing code to avoid introducing new issues.
- Focus on fixing data transformation rather than component structure.
- Add proper logging to help diagnose any issues that might arise during testing.
