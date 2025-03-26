# Mobile Home Defaults Implementation

This document explains the implementation of mobile home defaults based on the research data on manufactured housing energy characteristics.

## Overview

The mobile home defaults system provides research-based default values for various energy audit form fields when a user selects "mobile home" as their property type. These defaults are dynamically adjusted based on:

1. **Construction period** (determined by year built)
2. **Size category** (determined by square footage)
3. **Climate zone** (determined by state, if provided)

## Files and Components

### Core Implementation

- **`src/components/audit/forms/housingTypeDefaults.ts`**: Contains the core default values and helper functions
- **`src/components/audit/EnergyAuditForm.tsx`**: Handles applying the defaults to the form data
- **`src/components/audit/forms/HomeDetailsForm.tsx`**: Integration with the Home Details form section

## Timeframe Categories

Mobile homes are categorized by construction period, which significantly impacts their energy performance:

- **pre-1976**: Before HUD Code implementation, minimal standards
- **1976-1994**: First HUD Code era with basic standards
- **1994-2000**: Updated HUD Code with improved insulation requirements
- **post-2000**: Modern manufactured homes with better energy performance

## Size Categories

- **Small**: Under 1,000 sq ft (typically single-wide)
- **Medium**: 1,000-1,800 sq ft (typically double-wide)
- **Large**: Over 1,800 sq ft (larger double-wide or triple-wide)

## Climate Adaptation

Climate zone adjustments modify the energy usage estimates based on the state's climate zone:

- Zone 1 (very hot): 0.85x multiplier
- Zone 2 (hot): 0.9x multiplier
- Zone 3 (warm): 0.95x multiplier
- Zone 4 (mixed): 1.0x multiplier (baseline)
- Zone 5 (cool): 1.05x multiplier
- Zone 6 (cold): 1.15x multiplier
- Zone 7 (very cold): 1.25x multiplier
- Zone 8 (subarctic): 1.3x multiplier

## Implementation Details

### Core Function

The main function exposed for getting defaults is:

```typescript
getMobileHomeDefaults(yearBuilt: number, squareFootage: number, state?: string)
```

This function:
1. Determines the construction period from year built
2. Determines the size category from square footage
3. Gets the base defaults from the lookup table
4. Applies climate adjustment if state is provided
5. Returns the complete set of defaults

### Form Integration

In the `EnergyAuditForm.tsx` component, the mobile home defaults are applied in a useEffect hook that watches for changes to:
- `formData.basicInfo.propertyType`
- `formData.homeDetails.homeType`
- `formData.basicInfo.yearBuilt`

When a user selects "mobile-home" for both property type and home type, the system:
1. Gets the current year built and square footage values
2. Retrieves appropriate defaults from `getMobileHomeDefaults()`
3. Safely applies these values to the form data, accounting for type safety
4. Ignores any mobile home specific properties that don't exist in the form model

### Type Safety

The implementation includes type safety mechanisms:
- Enum validation for windowCondition, systemPerformance, etc.
- Default fallback values when mobile home data doesn't match form expectations
- Proper casting of generic data to specific form types

## Default Values Source

All default values are based on research from U.S. Energy Information Administration (EIA), RECS (Residential Energy Consumption Survey), and DOE data.

## Future Enhancements

Potential future improvements:
- Add support for more specific regional adjustments
- Include more granular age categories
- Add model-year specific defaults for common manufactured home models
- Integrate with real-time energy usage data for better estimates
