# Default Recommendations by Product Category

This document outlines the default recommendations that are automatically provided for each product category when a user has selected preferences but no specific audit recommendations are available.

## Product Categories and Recommendations

Our system provides default recommendations for all eight product categories of interest that users can select in the Energy Audit Form:

### 1. HVAC Systems
- **Primary Recommendation**: HVAC System Upgrade
  - Description: Replace aging HVAC system with an energy-efficient model to reduce energy consumption by up to 20%.
  - Estimated Savings: $520/year
  - Estimated Cost: $3,850
  - Payback Period: 7.4 years
  - Priority: High

- **Secondary Recommendation**: Smart Thermostat Installation
  - Description: Install a programmable smart thermostat to optimize your heating and cooling schedule based on your lifestyle patterns.
  - Estimated Savings: $120/year
  - Estimated Cost: $250
  - Payback Period: 2.1 years
  - Priority: Medium

### 2. Lighting
- **Recommendation**: Energy-Efficient LED Lighting
  - Description: Replace standard bulbs with LED lighting throughout your property to reduce lighting energy use by up to 75%.
  - Estimated Savings: $180/year
  - Estimated Cost: $450
  - Payback Period: 2.5 years
  - Priority: Medium

### 3. Insulation
- **Recommendation**: Attic Insulation Upgrade
  - Description: Add additional insulation to your attic to prevent heat loss during winter and keep cool air in during summer.
  - Estimated Savings: $250/year
  - Estimated Cost: $1,200
  - Payback Period: 4.8 years
  - Priority: High

### 4. Windows & Doors
- **Recommendation**: Energy-Efficient Windows
  - Description: Replace old windows with energy-efficient models to reduce drafts and heat transfer through your windows.
  - Estimated Savings: $180/year
  - Estimated Cost: $3,500
  - Payback Period: 19.4 years
  - Priority: Medium

### 5. Energy-Efficient Appliances
- **Recommendation**: Energy Star Appliance Upgrade
  - Description: Replace older appliances with Energy Star certified models to reduce electricity consumption throughout your home.
  - Estimated Savings: $120/year
  - Estimated Cost: $1,200
  - Payback Period: 10.0 years
  - Priority: Medium

### 6. Water Heating
- **Recommendation**: Tankless Water Heater Installation
  - Description: Replace your conventional water heater with an energy-efficient tankless model that heats water on demand.
  - Estimated Savings: $110/year
  - Estimated Cost: $1,800
  - Payback Period: 16.4 years
  - Priority: Medium

### 7. Smart Home Devices
- **Recommendation**: Smart Home Energy Management System
  - Description: Install a comprehensive smart home system to automate and optimize energy usage throughout your home.
  - Estimated Savings: $150/year
  - Estimated Cost: $600
  - Payback Period: 4.0 years
  - Priority: Low

### 8. Renewable Energy
- **Recommendation**: Solar Panel Installation
  - Description: Install solar panels to generate clean, renewable electricity and significantly reduce your utility bills.
  - Estimated Savings: $850/year
  - Estimated Cost: $12,000
  - Payback Period: 14.1 years
  - Priority: High

## Implementation Details

These default recommendations are implemented in the `generateDefaultRecommendations` method in `dashboardService.enhanced.ts`. The system provides these recommendations in scenarios where:

1. A user has just completed their first energy audit
2. A user has selected preferences but no custom recommendations exist
3. The recommendation filtering system does not find matches for the user's selected preferences

## Category Mapping System

The recommendation system uses a multi-layered matching approach:

1. **Exact Matching**: Looks for direct matches between user preferences and recommendation categories
2. **Flexible Matching**: Breaks down categories into keywords to find partial matches
3. **Default Fallback**: When no matches are found, provides these category-specific default recommendations

## Updating Default Recommendations

To update these default recommendations:

1. Modify the `generateDefaultRecommendations` method in `backend/src/services/dashboardService.enhanced.ts`
2. Update the appropriate recommendation objects with new information
3. Ensure each product category has at least one default recommendation
4. Deploy the changes following standard deployment practices

## Default Recommendation IDs

Each default recommendation has a unique ID with the format `default-rec-{type}` or `default-rec-{type}-{number}` for categories with multiple recommendations. These IDs help distinguish default recommendations from custom ones in the system logs and analytics.
