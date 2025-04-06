---
title: "DefaultRecommendationsProvider"
type: "Component"
path: "src/components/recommendations/DefaultRecommendationsProvider.tsx"
description: "Provides default recommendations when user preferences or audit data is unavailable"
tags: [recommendations, fallback, product-categories, dashboard]
status: "up-to-date"
last_verified: "2025-04-06"
---

# DefaultRecommendationsProvider

## Overview

The DefaultRecommendationsProvider is part of our recommendation fallback system that ensures users always see appropriate recommendations based on available data. It works in conjunction with both backend services and frontend adapters to provide a robust, fault-tolerant recommendation experience.

## Key Components

1. **Backend Fallback System** (dashboardService.enhanced.ts)
   - Three-tier fallback system for product preferences:
     1. First checks `user_preferences` table
     2. Then extracts preferences from audit data if available
     3. Finally uses default set of all product categories if nothing else available
   - Provides detailed logging at each stage for debugging

2. **Frontend Adapter** (EnhancedDashboardRecommendationsAdapter.tsx)
   - Client-side category derivation from recommendation types
   - Four-case handling system for all possible data scenarios:
     1. Has recommendations but no categories → derive from recommendation types
     2. No recommendations → handle empty state gracefully
     3. Effective categories available → use standard filtering
     4. No matches with effective categories → show highest priority recommendations

3. **Default Product Categories**
   - When no user preferences are available, the system uses a default set:
   ```typescript
   ['hvac', 'lighting', 'insulation', 'windows', 'appliances', 'water_heating', 'renewable', 'smart_home']
   ```

## Core Fallback Logic

```typescript
// Backend: Fallback categories when preferences aren't available
if (!productPreferences || !productPreferences.categories || productPreferences.categories.length === 0) {
  productPreferences = {
    categories: ['hvac', 'lighting', 'insulation', 'windows', 'appliances', 'water_heating', 'renewable', 'smart_home'],
    budgetConstraint: undefined
  };
}

// Frontend: Extract categories from recommendation types if needed
const deriveCategoriesFromRecommendations = (recs: AuditRecommendation[]): string[] => {
  // Extract unique recommendation types
  const recommendationTypes = [...new Set(recs.map(rec => rec.type))];
  
  // Map common recommendation types to product categories
  const categoryMapping: Record<string, string> = {
    'hvac': 'hvac',
    'lighting': 'lighting',
    // Additional mappings...
  };
  
  // Create list of likely categories based on recommendation types
  return recommendationTypes
    .map(type => categoryMapping[type] || type)
    .filter(Boolean);
};
```

## Relationships with Other Components

- **UnifiedRecommendations**: Receives processed recommendations after fallback handling
- **ProductRecommendationService**: Provides the filtering logic for matching recommendations to categories
- **EnhancedDashboardRecommendationsAdapter**: Bridges dashboard needs with the recommendation system
- **EnhancedReportRecommendationsAdapter**: Handles report-specific fallbacks

## Recent Updates

- Added extraction of product preferences from audit data (2025-04-06)
- Enhanced frontend fallback system to intelligently derive categories (2025-04-06)
- Fixed issue where empty categories array caused no recommendations to show (2025-04-06)

## Testing Considerations

When testing this system, verify:
1. Dashboard shows recommendations immediately after audit submission
2. Recommendations persist between user sessions
3. System gracefully handles missing or partial preference data
