# Product Recommendations Enhancement Plan

## Overview

This plan outlines the enhancements to our product recommendations system to ensure all product categories have relevant default recommendations and to improve the Amazon search links for more targeted product suggestions.

## Current System

- `EnhancedDashboardRecommendations.tsx`: Displays recommendations on the dashboard
- `ProductSuggestionCard.tsx`: Generates product cards with links to retailers
- `EnhancedReportRecommendations.tsx`: Displays recommendations in the Reports section
- `productRecommendationService.ts`: Provides product matching and filtering functionality
- `dashboardService.enhanced.ts`: Generates default recommendations when detailed data is unavailable

## Challenges to Address

1. Default recommendations currently only cover 2 out of 8 product categories
2. Amazon links use generic search terms instead of specific product names
3. The Reports section now replaces the old Recommendations section

## Implementation Plan

### 1. Enhance Amazon Link Generation

- **File to modify**: `src/components/reports/ProductSuggestionCard.tsx`
- **Changes needed**:
  - Update the `getAmazonUrl()` function to use the product's specific name as the primary search term
  - Add energy efficiency prefix to ensure relevant results
  - Include category as an additional search term for better relevance when needed

### 2. Expand Default Recommendations

- **File to modify**: `backend/src/services/dashboardService.enhanced.ts`
- **Changes needed**:
  - Update `generateDefaultRecommendations()` to include all 8 product categories
  - Ensure each recommendation includes appropriate:
    - Type (matching product category IDs)
    - Title and description
    - Financial data (savings, cost, payback period)
    - Priority level

## Deliverables Checklist

### Amazon Link Enhancement

- [x] Modify `getAmazonUrl()` function in `ProductSuggestionCard.tsx`
- [x] Ensure search URLs include specific product names
- [x] Add energy efficiency keywords for better search results
- [x] Test with various product types to confirm improved search results

### Default Recommendations Expansion

- [x] Update `generateDefaultRecommendations()` in `dashboardService.enhanced.ts`
- [x] Add/update recommendation for HVAC Systems (already exists)
- [x] Add/update recommendation for Lighting (already exists)
- [x] Add new recommendation for Insulation
- [x] Add new recommendation for Windows & Doors
- [x] Add new recommendation for Energy-Efficient Appliances
- [x] Add new recommendation for Water Heating
- [x] Add new recommendation for Smart Home Devices
- [x] Add new recommendation for Renewable Energy
- [x] Ensure all recommendations have appropriate financial data
- [x] Verify type fields match exactly with product category IDs

## Recommendation Details

### HVAC Systems
```javascript
{
  id: 'sample-rec-1',
  title: 'HVAC System Upgrade',
  description: 'Replace aging HVAC system with energy-efficient model to reduce energy consumption.',
  type: 'hvac', // Matches product category ID
  priority: 'high',
  status: 'active',
  estimatedSavings: 520,
  estimatedCost: 3850,
  paybackPeriod: 7.4,
  // Other fields...
}
```

### Lighting
```javascript
{
  id: 'sample-rec-2',
  title: 'Energy-Efficient Lighting',
  description: 'Replace standard bulbs with LED lighting throughout the property.',
  type: 'lighting',
  priority: 'medium',
  status: 'active',
  estimatedSavings: 180,
  estimatedCost: 450,
  paybackPeriod: 2.5,
  // Other fields...
}
```

### Insulation
```javascript
{
  id: 'default-rec-insulation',
  title: 'Attic Insulation Upgrade',
  description: 'Add insulation to your attic to prevent heat loss and improve energy efficiency.',
  type: 'insulation',
  priority: 'high',
  status: 'active',
  estimatedSavings: 250,
  estimatedCost: 1200,
  paybackPeriod: 4.8,
  // Other fields...
}
```

### Windows & Doors
```javascript
{
  id: 'default-rec-windows',
  title: 'Energy-Efficient Windows',
  description: 'Replace old windows with energy-efficient models to reduce drafts and heat transfer.',
  type: 'windows',
  priority: 'medium',
  status: 'active',
  estimatedSavings: 180,
  estimatedCost: 3500,
  paybackPeriod: 19.4,
  // Other fields...
}
```

### Energy-Efficient Appliances
```javascript
{
  id: 'default-rec-appliances',
  title: 'Energy Star Appliance Upgrade',
  description: 'Replace older appliances with Energy Star certified models to reduce electricity consumption.',
  type: 'appliances',
  priority: 'medium',
  status: 'active',
  estimatedSavings: 120,
  estimatedCost: 1200,
  paybackPeriod: 10.0,
  // Other fields...
}
```

### Water Heating
```javascript
{
  id: 'default-rec-water-heating',
  title: 'Tankless Water Heater Installation',
  description: 'Replace your conventional water heater with an energy-efficient tankless model.',
  type: 'water_heating',
  priority: 'medium',
  status: 'active',
  estimatedSavings: 110,
  estimatedCost: 1800,
  paybackPeriod: 16.4,
  // Other fields...
}
```

### Smart Home Devices
```javascript
{
  id: 'default-rec-smart-home',
  title: 'Smart Home Energy Management System',
  description: 'Install smart home devices to automate and optimize energy usage throughout your home.',
  type: 'smart_home',
  priority: 'low',
  status: 'active',
  estimatedSavings: 150,
  estimatedCost: 600,
  paybackPeriod: 4.0,
  // Other fields...
}
```

### Renewable Energy
```javascript
{
  id: 'default-rec-renewable',
  title: 'Solar Panel Installation',
  description: 'Install solar panels to generate clean, renewable electricity and reduce utility bills.',
  type: 'renewable',
  priority: 'high',
  status: 'active',
  estimatedSavings: 850,
  estimatedCost: 12000,
  paybackPeriod: 14.1,
  // Other fields...
}
```

## Testing

1. Verify default recommendations appear for all 8 categories in the Reports section
2. Verify Amazon links lead to more targeted search results for each product
3. Test with various user category preferences to ensure correct filtering

## Deployment

- Do not use deployment scripts
- Follow the manual deployment process:
  1. Make code changes
  2. Push to Git
  3. Push to Heroku
