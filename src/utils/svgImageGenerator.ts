/**
 * SVG Image Generator
 * 
 * This utility generates SVG images for products when no other images are available.
 * It creates visually distinct SVGs based on product properties like name and category.
 */

// Color palettes for different product categories
const CATEGORY_COLORS: Record<string, string[]> = {
  // Blues for water/cooling related categories
  'Water Heaters': ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD'],
  'Heating & Cooling': ['#1D4ED8', '#3B82F6', '#60A5FA', '#BFDBFE'],
  
  // Greens for eco-friendly categories
  'Building Products': ['#059669', '#10B981', '#34D399', '#A7F3D0'],
  'Appliances': ['#047857', '#10B981', '#34D399', '#6EE7B7'],
  
  // Ambers/oranges for lighting categories
  'Lighting & Fans': ['#D97706', '#F59E0B', '#FBBF24', '#FDE68A'],
  'Lighting': ['#B45309', '#F59E0B', '#FBBF24', '#FDE68A'],
  
  // Purple/violets for electronics
  'Electronics': ['#6D28D9', '#8B5CF6', '#A78BFA', '#DDD6FE'],
  'Office Equipment': ['#5B21B6', '#8B5CF6', '#A78BFA', '#DDD6FE'],
  'Data Center Equipment': ['#4C1D95', '#7C3AED', '#A78BFA', '#DDD6FE'],
  
  // Reds for cooking/heat products
  'Commercial Appliances': ['#B91C1C', '#EF4444', '#F87171', '#FECACA'],
  'Commercial Food Service Equipment': ['#991B1B', '#EF4444', '#F87171', '#FECACA']
};

// Default palette for any category not specifically defined
const DEFAULT_COLORS = ['#1E40AF', '#3B82F6', '#60A5FA', '#BFDBFE'];

// Patterns for the SVG backgrounds
const PATTERNS = [
  // Grid
  (color: string) => `<pattern id="grid" patternUnits="userSpaceOnUse" width="20" height="20">
    <rect width="20" height="20" fill="none" stroke="${color}" stroke-width="0.5" opacity="0.3"/>
  </pattern>`,
  
  // Dots
  (color: string) => `<pattern id="dots" patternUnits="userSpaceOnUse" width="20" height="20">
    <circle cx="10" cy="10" r="2" fill="${color}" opacity="0.3"/>
  </pattern>`,
  
  // Diagonal lines
  (color: string) => `<pattern id="diagonals" patternUnits="userSpaceOnUse" width="20" height="20">
    <path d="M0,20 l20,-20 M-5,5 l10,-10 M15,25 l10,-10" stroke="${color}" stroke-width="0.5" opacity="0.3"/>
  </pattern>`,
  
  // Waves
  (color: string) => `<pattern id="waves" patternUnits="userSpaceOnUse" width="40" height="20">
    <path d="M0,10 c5,-5 10,-5 15,0 s10,5 15,0 s10,-5 15,0" fill="none" stroke="${color}" stroke-width="0.5" opacity="0.3"/>
  </pattern>`
];

// Badge shapes for efficiency ratings
const EFFICIENCY_BADGES = {
  'High Efficiency': (color: string) => `
    <g transform="translate(200, 60)">
      <rect x="-50" y="-20" width="100" height="40" rx="20" fill="${color}" opacity="0.2" />
      <text x="0" y="5" font-size="16" text-anchor="middle" fill="${color}" font-weight="bold">High Efficiency</text>
    </g>
  `,
  'Medium Efficiency': (color: string) => `
    <g transform="translate(200, 60)">
      <rect x="-50" y="-20" width="100" height="40" rx="20" fill="${color}" opacity="0.15" />
      <text x="0" y="5" font-size="16" text-anchor="middle" fill="${color}" font-weight="bold">Medium</text>
    </g>
  `,
  'Standard': (color: string) => `
    <g transform="translate(200, 60)">
      <rect x="-50" y="-20" width="100" height="40" rx="20" fill="${color}" opacity="0.1" />
      <text x="0" y="5" font-size="16" text-anchor="middle" fill="${color}" font-weight="bold">Standard</text>
    </g>
  `
};

/**
 * Generate a simple hash for a string
 * This is used to create consistent but different colors for the same input
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Get category-specific colors based on product properties
 */
function getCategoryColors(category: string): string[] {
  // Try to find exact match
  if (category && CATEGORY_COLORS[category]) {
    return CATEGORY_COLORS[category];
  }
  
  // Try to find partial match
  const categoryKey = Object.keys(CATEGORY_COLORS).find(key => 
    category && category.includes(key) || (key && key.includes(category))
  );
  
  if (categoryKey) {
    return CATEGORY_COLORS[categoryKey];
  }
  
  // Default fallback
  return DEFAULT_COLORS;
}

/**
 * Generate an SVG image for a product
 * @param name - Product name
 * @param category - Product category
 * @param efficiency - Energy efficiency rating
 */
export function generateProductImage(
  name: string = 'Product', 
  category: string = '', 
  efficiency: string = 'Standard'
): string {
  // Get color palette based on product category
  const colors = getCategoryColors(category);
  
  // Use name and category to deterministically select colors
  const nameHash = simpleHash(name);
  const catHash = simpleHash(category || 'default');
  
  const mainColor = colors[nameHash % colors.length];
  const accentColor = colors[(nameHash + 1) % colors.length];
  const textColor = colors[(nameHash + 2) % colors.length];
  
  // Select pattern based on product category
  const patternIndex = catHash % PATTERNS.length;
  const pattern = PATTERNS[patternIndex](accentColor);
  
  // Create text elements - handle potentially long product names
  let productNameDisplay = name;
  let fontSize = 24;
  let lineCount = 1;
  
  if (name.length > 20) {
    // For long names, split into two lines
    const words = name.split(' ');
    const midpoint = Math.floor(words.length / 2);
    const firstLine = words.slice(0, midpoint).join(' ');
    const secondLine = words.slice(midpoint).join(' ');
    productNameDisplay = `${firstLine}\n${secondLine}`;
    fontSize = 20;
    lineCount = 2;
  }
  
  // Get efficiency badge based on rating
  let badge = '';
  if (efficiency && efficiency in EFFICIENCY_BADGES) {
    badge = EFFICIENCY_BADGES[efficiency](textColor);
  } else if (efficiency) {
    badge = EFFICIENCY_BADGES['Standard'](textColor);
  }
  
  // Generate SVG
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
    <defs>
      ${pattern}
      <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${mainColor}" stop-opacity="0.1"/>
        <stop offset="100%" stop-color="${mainColor}" stop-opacity="0.3"/>
      </linearGradient>
    </defs>
    
    <!-- Background -->
    <rect width="400" height="300" fill="url(#bgGradient)" />
    <rect width="400" height="300" fill="url(#${pattern.match(/id="([^"]+)"/)?.[1] || 'grid'})" />
    
    <!-- Category indicator -->
    <rect x="0" y="0" width="400" height="40" fill="${mainColor}" opacity="0.7" />
    <text x="200" y="25" font-family="Arial, sans-serif" font-size="18" text-anchor="middle" fill="white">
      ${category || 'Energy Efficient Product'}
    </text>
    
    <!-- Product name -->
    ${lineCount === 1 ? 
      `<text x="200" y="140" font-family="Arial, sans-serif" font-size="${fontSize}" text-anchor="middle" font-weight="bold" fill="${textColor}">${productNameDisplay}</text>` :
      `<text x="200" y="120" font-family="Arial, sans-serif" font-size="${fontSize}" text-anchor="middle" font-weight="bold" fill="${textColor}">
        <tspan x="200" dy="0">${productNameDisplay.split('\n')[0]}</tspan>
        <tspan x="200" dy="${fontSize + 5}">${productNameDisplay.split('\n')[1]}</tspan>
      </text>`
    }
    
    <!-- Efficiency badge -->
    ${badge}
    
    <!-- Decorative elements -->
    <circle cx="50" cy="50" r="15" fill="none" stroke="${accentColor}" stroke-width="2" opacity="0.5" />
    <circle cx="350" cy="250" r="15" fill="none" stroke="${accentColor}" stroke-width="2" opacity="0.5" />
    
    <!-- Energy star indicator -->
    <g transform="translate(200, 210)">
      <path d="M0,-30 L6,-9 L28,-9 L10,3 L16,24 L0,12 L-16,24 L-10,3 L-28,-9 L-6,-9 Z" 
            fill="none" stroke="${textColor}" stroke-width="1.5" opacity="0.6" />
      <text x="0" y="40" font-family="Arial, sans-serif" font-size="14" text-anchor="middle" fill="${textColor}" opacity="0.8">
        Energy Efficient
      </text>
    </g>
  </svg>`;
  
  // Convert to data URI for immediate use in img tags
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
