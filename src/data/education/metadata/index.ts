// src/data/education/metadata/index.ts
import { EducationalResource } from '@/types/education';
import { insulation } from './insulation';
import { renewableEnergy } from './renewable-energy';

// Combine all resource metadata from different categories
export const allResources: EducationalResource[] = [
  ...insulation,
  ...renewableEnergy,
  // Add more categories here as they are created
];

// Export named collections for easier imports
export { insulation, renewableEnergy };

// Default export for convenience
export default {
  all: allResources,
  insulation,
  renewableEnergy,
};
