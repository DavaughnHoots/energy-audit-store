// src/data/education/content/index.ts

// Define a mapping of content paths to their import functions
// This allows Vite to properly analyze the imports at build time
const contentMap: Record<string, () => Promise<any>> = {
  // Insulation content
  'insulation/advanced-techniques': () => import('./insulation/advanced-techniques.ts'),
  
  // Renewable Energy content
  'renewable-energy/residential-solar': () => import('./renewable-energy/residential-solar.ts'),
  
  // Add more content files here as they are created
  // Example:
  // 'energy-management/basics': () => import('./energy-management/basics.ts'),
  // 'energy-saving/tips': () => import('./energy-saving/tips.ts'),
  // 'home-efficiency/guide': () => import('./home-efficiency/guide.ts'),
};

/**
 * Dynamically loads content for a specified resource
 * @param contentPath Path to the content file relative to /src/data/education/content
 */
export const loadContent = async (contentPath: string) => {
  try {
    // Check if the content path exists in our mapping
    if (!contentMap[contentPath]) {
      throw new Error(`Content path not found in content map: ${contentPath}`);
    }
    
    // Use the mapped import function
    const module = await contentMap[contentPath]();
    return module.default;
  } catch (error) {
    console.error(`Failed to load education content: ${contentPath}`, error);
    throw new Error(`Content not found: ${contentPath}`);
  }
};

export default {
  loadContent
};
