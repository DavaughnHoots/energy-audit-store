---
title: "DefaultFinancialValues Utility"
type: "utility"
path: "/src/utils/defaultFinancialValues.ts"
description: "Provides realistic default financial values for recommendations when actual data is missing"
tags: [financial-data, recommendations, defaults, fallbacks]
status: "up-to-date"
last_verified: "2025-04-07"
---

# DefaultFinancialValues Utility

## Overview

The DefaultFinancialValues utility provides realistic default financial values for energy efficiency recommendations when actual values are not available from the API. This ensures that recommendation cards and charts always display plausible data even when backend values are missing or zero.

## Key Features

- Provides type-specific default financial values for all product categories
- Enriches recommendation objects with appropriate default values
- Enriches chart data points with reasonable financial values
- Preserves actual values when available and non-zero
- Intelligently determines category from recommendation names when type is missing

## Default Values by Category

The utility provides default values for:

| Category | Estimated Annual Savings | Implementation Cost | Payback Period (years) |
|----------|--------------------------|---------------------|------------------------|
| HVAC | $520 | $3,800 | 7.3 |
| Lighting | $180 | $350 | 1.9 |
| Insulation | $230 | $1,200 | 5.2 |
| Windows & Doors | $310 | $4,500 | 14.5 |
| Appliances | $120 | $800 | 6.7 |
| Water Heating | $140 | $950 | 6.8 |
| Renewable Energy | $850 | $12,000 | 14.1 |
| Smart Home | $90 | $350 | 3.9 |
| Humidity Control | $70 | $400 | 5.7 |
| Default (unknown type) | $200 | $1,000 | 5.0 |

## Implementation Details

### Constants

```typescript
// Default savings estimates by recommendation type
export const DEFAULT_SAVINGS_BY_TYPE: Record<string, number> = {
  hvac: 520,          // HVAC systems typically save $520/year
  lighting: 180,      // Lighting upgrades typically save $180/year
  insulation: 230,    // Insulation improvements typically save $230/year
  windows: 310,       // Window upgrades typically save $310/year
  appliances: 120,    // Energy-efficient appliances typically save $120/year
  water_heating: 140, // Water heating efficiency typically saves $140/year
  renewable: 850,     // Renewable energy typically saves $850/year
  smart_home: 90,     // Smart home devices typically save $90/year
  humidity: 70,       // Humidity control typically saves $70/year
  default: 200        // Default value if type is not recognized
};

// Default implementation costs by recommendation type
export const DEFAULT_COSTS_BY_TYPE: Record<string, number> = {
  hvac: 3800,         // HVAC replacement typically costs $3,800
  lighting: 350,      // Lighting upgrades typically cost $350
  // ... and more
};

// Default payback periods (years) by recommendation type
export const DEFAULT_PAYBACK_BY_TYPE: Record<string, number> = {
  hvac: 7.3,          // HVAC systems typically have a 7.3 year payback
  lighting: 1.9,      // Lighting upgrades typically have a 1.9 year payback
  // ... and more
};
```

### Helper Functions

The utility provides three main helper functions:

1. `getDefaultFinancialValues(type: string)`: Returns default values for a specific type
2. `enrichRecommendationWithDefaultValues(recommendation: any)`: Enriches a recommendation with default values
3. `enrichChartDataWithDefaultValues(chartItem: any)`: Enriches chart data with default values

## Usage

```typescript
import { 
  enrichRecommendationWithDefaultValues, 
  enrichChartDataWithDefaultValues 
} from '@/utils/defaultFinancialValues';

// Enrich a recommendation with default values when actual values are missing
const enhancedRecommendation = enrichRecommendationWithDefaultValues(recommendation);

// Enrich chart data with default values based on item name
const enhancedChartData = enrichChartDataWithDefaultValues(chartItem);
```

## Dependencies / Imports

None - this is a standalone utility that doesn't depend on other modules.

## Related Files

- [[UserDashboardPage]]: Uses these defaults for recommendation financial data
- [[DashboardEnergyAnalysis]]: Displays the financial data in charts
- [[EnhancedDashboardRecommendations]]: Displays the financial data in recommendation cards
