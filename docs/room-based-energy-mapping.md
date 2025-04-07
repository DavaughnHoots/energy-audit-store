# Room-Based Energy Consumption Mapping

## Overview

This document outlines the methodology and mappings for transforming abstract energy consumption categories (Base, Seasonal, Occupied, Real) into more intuitive room-based categories (Living Room, Kitchen, Bedrooms, Bathroom, Outdoor) for the Energy Audit dashboard. This transformation will make energy consumption data more relatable and actionable for users.

## 1. Base Distribution Percentages

### 1.1 Default Room Energy Distribution by Property Type

The following tables define baseline percentage distributions of energy consumption across different room types based on property type.

#### Single-Family Home Base Distribution

| Room Type    | Percentage | Description/Justification |
|--------------|------------|---------------------------|
| Living Room  | 28%        | Entertainment devices, main lighting, shared HVAC usage |
| Kitchen      | 24%        | Refrigerator, oven, dishwasher, small appliances |
| Bedrooms     | 18%        | Lighting, electronics, personal devices, heating/cooling |
| Bathroom     | 10%        | Water heating, ventilation, lighting |
| Outdoor      | 20%        | Exterior lighting, garage, lawn equipment, pools |

#### Apartment/Condominium Base Distribution

| Room Type    | Percentage | Description/Justification |
|--------------|------------|---------------------------|
| Living Room  | 32%        | Higher proportion due to limited overall space |
| Kitchen      | 26%        | Higher proportion due to limited overall space |
| Bedrooms     | 24%        | Higher proportion due to limited overall space |
| Bathroom     | 12%        | Higher proportion due to limited overall space |
| Outdoor      | 6%         | Limited to balcony/patio areas only |

#### Townhouse Base Distribution

| Room Type    | Percentage | Description/Justification |
|--------------|------------|---------------------------|
| Living Room  | 30%        | Intermediate between single-family and apartment |
| Kitchen      | 25%        | Intermediate between single-family and apartment |
| Bedrooms     | 20%        | Slightly higher than single-family homes |
| Bathroom     | 11%        | Slightly higher than single-family homes |
| Outdoor      | 14%        | Reduced compared to single-family, but more than apartments |

#### Mobile Home Base Distribution

| Room Type    | Percentage | Description/Justification |
|--------------|------------|---------------------------|
| Living Room  | 30%        | Combined living spaces often take larger proportion |
| Kitchen      | 26%        | Often integrated with living area in open plan |
| Bedrooms     | 22%        | Usually smaller but still significant energy usage |
| Bathroom     | 12%        | Comparable to apartments |
| Outdoor      | 10%        | Limited exterior space but still some outdoor usage |

### 1.2 Age-Based Adjustments

Property age affects the distribution of energy consumption across rooms. These multipliers are applied to the base distributions.

| Construction Period | Living Room | Kitchen | Bedrooms | Bathroom | Outdoor |
|---------------------|-------------|---------|----------|----------|---------|
| Pre-1950            | 0.95        | 1.10    | 0.95     | 1.15     | 0.90    |
| 1950-1979           | 0.98        | 1.05    | 0.98     | 1.10     | 0.95    |
| 1980-1999           | 1.00        | 1.00    | 1.00     | 1.00     | 1.00    |
| 2000-2009           | 1.02        | 0.95    | 1.02     | 0.95     | 1.05    |
| 2010-Present        | 1.05        | 0.90    | 1.05     | 0.90     | 1.10    |

*Rationale:* Older homes typically have less efficient kitchen and bathroom fixtures/appliances, while newer homes tend to have more electronics in living rooms and bedrooms.

## 2. Adjustment Factors Based on Energy Audit Inputs

### 2.1 Occupancy Pattern Adjustments

The occupancy pattern selected by users affects room energy distribution.

| Occupancy Pattern    | Living Room | Kitchen | Bedrooms | Bathroom | Outdoor |
|----------------------|-------------|---------|----------|----------|---------|
| Home All Day         | +15%        | +10%    | -5%      | +5%      | -25%    |
| Away During Work     | -10%        | -5%     | -5%      | -5%      | +25%    |
| Evenings/Weekends    | +5%         | +5%     | +10%     | 0%       | -20%    |
| Variable Schedule    | 0%          | 0%      | 0%       | 0%       | 0%      |

*Note:* These are relative percentage adjustments to the room's existing allocation, not absolute percentage points.

### 2.2 Seasonal Variation Adjustments

Seasonal usage patterns affect which rooms consume more energy during different times of the year.

| Seasonal Variation   | Living Room | Kitchen | Bedrooms | Bathroom | Outdoor |
|----------------------|-------------|---------|----------|----------|---------|
| Highest in Summer    | -5%         | -10%    | +5%      | -5%      | +15%    |
| Highest in Winter    | +10%        | +5%     | +5%      | +10%     | -30%    |
| Fairly Consistent    | 0%          | 0%      | 0%       | 0%       | 0%      |

### 2.3 Light Bulb Type Adjustments

The mix of bulb types affects energy consumption distribution.

| Primary Bulb Type      | Living Room | Kitchen | Bedrooms | Bathroom | Outdoor |
|------------------------|-------------|---------|----------|----------|---------|
| Mostly LED/Efficient   | -8%         | -8%     | -8%      | -8%      | -8%     |
| Mix of Bulb Types      | 0%          | 0%      | 0%       | 0%       | 0%      |
| Mostly Older Bulb Types| +10%        | +10%    | +10%     | +10%     | +10%    |

*Note:* These adjustments primarily affect the lighting component of each room's energy usage.

### 2.4 Natural Light Adjustments

The amount of natural light available affects artificial lighting needs.

| Natural Light Level | Living Room | Kitchen | Bedrooms | Bathroom |
|---------------------|-------------|---------|----------|----------|
| Good Natural Light  | -5%         | -5%     | -5%      | -3%      |
| Moderate Natural Light | 0%       | 0%      | 0%       | 0%       |
| Limited Natural Light | +7%       | +7%     | +7%      | +5%      |

### 2.5 Lighting Controls Adjustments

Advanced lighting controls reduce energy usage.

| Lighting Controls | Living Room | Kitchen | Bedrooms | Bathroom | Outdoor |
|-------------------|-------------|---------|----------|----------|---------|
| Basic Switches    | 0%          | 0%      | 0%       | 0%       | 0%      |
| Some Advanced     | -5%         | -5%     | -5%      | -5%      | -5%     |
| Smart/Automated   | -15%        | -15%    | -15%     | -15%     | -15%    |

### 2.6 Heating System Type Adjustments

Different heating systems affect room energy distribution.

| Heating System Type | Living Room | Kitchen | Bedrooms | Bathroom | Outdoor |
|---------------------|-------------|---------|----------|----------|---------|
| Central Furnace     | +5%         | -5%     | +5%      | +5%      | -10%    |
| Heat Pump           | +3%         | -3%     | +3%      | +3%      | -6%     |
| Baseboard/Electric  | +10%        | +5%     | +10%     | +10%     | -35%    |
| Boiler/Radiator     | +5%         | 0%      | +5%      | +10%     | -20%    |
| Space Heaters       | +15%        | +5%     | +10%     | +10%     | -40%    |
| Other               | 0%          | 0%      | 0%       | 0%       | 0%      |

### 2.7 Cooling System Type Adjustments

Different cooling systems affect room energy distribution.

| Cooling System Type | Living Room | Kitchen | Bedrooms | Bathroom | Outdoor |
|---------------------|-------------|---------|----------|----------|---------|
| Central AC          | +5%         | -5%     | +5%      | 0%       | -5%     |
| Window Units        | +10%        | 0%      | +15%     | -5%      | -20%    |
| Heat Pump           | +5%         | -5%     | +5%      | 0%       | -5%     |
| Evaporative Cooler  | +8%         | -3%     | +8%      | -3%      | -10%    |
| None                | -10%        | 0%      | -10%     | 0%       | +20%    |

### 2.8 System Performance Adjustments

How well the HVAC system performs affects distribution.

| System Performance | All Indoor Rooms | Outdoor |
|--------------------|------------------|---------|
| Works Well         | -5%              | 0%      |
| Some Problems      | +3%              | 0%      |
| Needs Attention    | +10%             | 0%      |

## 3. Mapping Energy Audit Fields to Room-Based Impact

This section maps specific form fields from the energy audit to their impact on room-based consumption.

### 3.1 EnergyUseForm Fields

| Field Name          | Impact Description | Rooms Affected |
|---------------------|-------------------|----------------|
| occupancyPattern    | Determines when home is occupied | All rooms (see 2.1) |
| seasonalVariation   | Affects how seasons impact usage | All rooms (see 2.2) |
| electricBill        | Base value for total consumption | All rooms |
| gasBill             | Affects heating/cooking allocation | Living Room, Kitchen, Bedrooms |
| powerConsumption    | Overall consumption level | All rooms |
| occupancyHours      | Hours spent at home | All rooms |
| peakUsageTimes      | When energy is used most | Varies by selection |
| monthlyBill         | Overall consumption level | All rooms |
| renewableEnergy     | Reduces grid energy consumption | All rooms (proportional) |

### 3.2 LightingForm Fields

| Field Name          | Impact Description | Rooms Affected |
|---------------------|-------------------|----------------|
| primaryBulbType     | Efficiency of lighting | All rooms (see 2.3) |
| naturalLight        | Natural lighting availability | All rooms (see 2.4) |
| lightingControls    | Advanced controls save energy | All rooms (see 2.5) |
| lightingPatterns    | When lights are used | Maps to specific rooms |
| bulbPercentages     | Mix of bulb efficiencies | All rooms (weighted) |
| fixtures            | Specific fixture usage | Maps to rooms by fixture name |

### 3.3 HVACForm Fields

| Field Name           | Impact Description | Rooms Affected |
|----------------------|-------------------|----------------|
| heatingSystem.type   | Type of heating system | All rooms (see 2.6) |
| coolingSystem.type   | Type of cooling system | All rooms (see 2.7) |
| thermostatType       | Programmable saves energy | All indoor rooms |
| zoneCount            | Multiple zones improve efficiency | All indoor rooms |
| systemPerformance    | Overall HVAC performance | All rooms (see 2.8) |

## 4. Calculation Methodology

### 4.1 Step-by-Step Calculation Process

1. **Select Base Distribution**:
   - Based on property type (single-family, apartment, townhouse, mobile home)
   - Example: Single-family home → Living Room (28%), Kitchen (24%), etc.

2. **Apply Property Age Adjustments**:
   - Multiply each room's base percentage by the age adjustment factor
   - Example: 1960s home, Living Room = 28% × 0.98 = 27.44%

3. **Apply Occupancy Pattern Adjustments**:
   - Adjust based on when the home is occupied
   - Example: "Home All Day" → Living Room = 27.44% × 1.15 = 31.56%

4. **Apply Seasonal Variation Adjustments**:
   - Adjust based on seasonal usage patterns
   - Example: "Highest in Winter" → Living Room = 31.56% × 1.10 = 34.72%

5. **Apply System-Specific Adjustments**:
   - HVAC, lighting, and other systems adjustments
   - Example: With central heating, Living Room = 34.72% × 1.05 = 36.46%

6. **Normalize Percentages**:
   - Ensure all room percentages sum to 100%
   - Scale all values proportionally if needed

7. **Calculate kWh Values**:
   - Multiply total energy consumption by each room's percentage
   - Example: Total 15,000 kWh, Living Room = 15,000 × 36.46% = 5,469 kWh

### 4.2 Mapping from Current Categories to Room-Based Categories

The current energy consumption chart shows four abstract categories:
- Base
- Seasonal
- Occupied
- Real

These can be mapped to room-based categories as follows:

| Current Category | Room-Based Mapping Approach |
|------------------|------------------------------|
| Base | Distributed proportionally across all rooms as the foundation |
| Seasonal | Weighted more heavily to Outdoor and Living Room during summer, Bedrooms and Bathroom during winter |
| Occupied | Mapped according to occupancy patterns from the audit, primarily affecting Living Room and Kitchen |
| Real | Represents actual measured consumption, distributed according to calculated room percentages |

### 4.3 Special Case Handling

#### Renewable Energy Sources

If the user has solar panels or other renewable energy sources:
- Reduce the total grid energy consumption proportionally
- Apply room-based calculations to the net grid consumption

#### Missing Data Handling

If certain audit fields are missing:
- Use defaults based on property type, size, and region
- Apply more conservative adjustment factors
- Flag the estimate as lower confidence

## 5. Implementation Guidelines

### 5.1 Data Model Updates

A new data structure will be added to store room-based energy consumption:

```typescript
interface RoomEnergyConsumption {
  livingRoom: number;
  kitchen: number;
  bedrooms: number;
  bathroom: number;
  outdoor: number;
  [key: string]: number; // For custom room types in future
}
```

### 5.2 Calculation Function Interface

```typescript
function calculateRoomEnergyConsumption(
  auditData: EnergyAuditData, 
  totalConsumption: number
): RoomEnergyConsumption {
  // Implementation following the methodology in section 4
}
```

### 5.3 Chart Display Guidelines

Room-based energy consumption will be presented as a bar chart with:
- One bar per room type
- Consistent color coding (see below)
- Tooltips explaining what each room category includes
- Optional toggle to switch between abstract and room-based views

### 5.4 Room Colors

| Room Type    | Color Hex | Description |
|--------------|-----------|-------------|
| Living Room  | #4287f5   | Blue |
| Kitchen      | #f5a742   | Amber |
| Bedrooms     | #42c5f5   | Light Blue |
| Bathroom     | #8e42f5   | Purple |
| Outdoor      | #42f575   | Green |

### 5.5 Tooltip Content

| Room Type    | Tooltip Description |
|--------------|---------------------|
| Living Room  | "Includes entertainment devices, main lighting, and HVAC usage in living spaces" |
| Kitchen      | "Includes refrigerator, oven, dishwasher, and kitchen appliances" |
| Bedrooms     | "Includes bedroom lighting, electronics, and heating/cooling" |
| Bathroom     | "Includes water heating, ventilation, and lighting in bathrooms" |
| Outdoor      | "Includes exterior lighting, garage, lawn equipment, and outdoor appliances" |

## 6. References and Research

The room-based distribution percentages and adjustment factors are based on research from:

1. U.S. Department of Energy Residential Energy Consumption Survey (RECS)
2. Home Energy Yardstick from ENERGY STAR
3. Lawrence Berkeley National Laboratory (LBNL) home energy studies
4. Industry standards for energy auditing and energy modeling
5. Energy consumption patterns from residential energy monitoring studies

---

*This document serves as the specification for implementing room-based energy consumption visualization in the Energy Audit application. Implementation will follow this methodology to provide users with more intuitive and actionable insights into their energy usage patterns.*
