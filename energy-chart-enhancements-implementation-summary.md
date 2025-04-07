# Energy Chart Enhancements Implementation Summary

## Overview

This implementation adds detailed energy breakdown categories to the dashboard charts and fixes the Y-axis label overlap issue in the Energy Consumption Factors chart.

## Key Components

### 1. Energy Breakdown Calculations Utility (`src/utils/energyBreakdownCalculations.ts`)

A new utility module that:
- Provides default energy breakdown across 5 categories (HVAC, Lighting, Appliances, Electronics, Other)
- Implements logic to calculate category values based on audit responses
- Transforms basic electricity/gas data into a detailed multi-category breakdown

### 2. Dashboard Page Integration (`src/pages/NewUserDashboardPage.tsx`)

Updated to:
- Import the new energy breakdown utility
- Process report data using the `enhanceEnergyBreakdown` function
- Pass detailed category data to chart components

### 3. Chart Display Improvements (`src/components/dashboard2/ChartSection.tsx`)

Modified to:
- Fix the Y-axis label overlap by moving it outside with a 35px offset
- Increase the Y-axis width from 55px to 60px
- Maintain color mappings for energy categories

### 4. Deployment Script (`scripts/heroku_deploy_energy_chart_frontend_fix.js`)

A new deployment script that:
- Creates/checks out a dedicated branch for the fix
- Verifies that all required files exist
- Commits changes to the repository
- Builds frontend assets
- Deploys to Heroku with force push to ensure updates are applied

## Implementation Details

### Energy Breakdown Categories

The detailed breakdown replaces the simple electricity/gas division with:

| Category    | Default % | Color   | Calculation Factors                    |
|-------------|-----------|---------|---------------------------------------|
| HVAC        | 42%       | Blue    | System Performance                    |
| Lighting    | 18%       | Teal    | Lighting Types                        |
| Appliances  | 15%       | Yellow  | Heating/Cooling System Types          |
| Electronics | 14%       | Orange  | Monthly Energy Bill                   |
| Other       | 11%       | Purple  | Temperature Consistency               |

### Calculation Logic

The utility intelligently adjusts category values based on audit responses:

- **HVAC**: Varies based on system performance (35-50%)
  - Works Well: 35%
  - Some Problems: 42%
  - Needs Attention: 50%

- **Lighting**: Varies based on bulb types (12-25%)
  - Mostly LED/Efficient: 12%
  - Mixed Types: 18%
  - Mostly Older Bulbs: 25%

- **Other Systems**: Varies based on temperature consistency (8-15%)
  - Very Consistent: 8%
  - Some Variations: 11%
  - Large Variations: 15%

Similar adjustments are made for other categories based on relevant audit responses.

## Deployment Instructions

1. Run the deployment script using the provided batch file:
   ```
   run-heroku-deploy-energy-chart-frontend-fix.bat
   ```

2. The script will:
   - Create/checkout the `energy-chart-fix` branch
   - Commit the changes
   - Build frontend assets
   - Deploy to Heroku with `--force` flag

## Verification

After deployment, verify:
1. The Energy Breakdown pie chart shows 5 categories instead of 2
2. The Y-axis label in the Energy Consumption Factors chart is clearly visible and not overlapped by numbers
3. All charts render with appropriate colors and labels
