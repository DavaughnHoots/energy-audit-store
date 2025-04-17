/**
 * SVG Image Generator
 * 
 * Generates dynamic SVG images based on product/category information.
 * These SVGs are encoded as data URIs and can be used directly in image src attributes.
 * This provides reliable fallbacks when external images are unavailable.
 */

interface SvgImageOptions {
  text?: string;
  backgroundColor?: string;
  textColor?: string;
  width?: number;
  height?: number;
  fontSize?: number;
  icon?: 'product' | 'category' | 'none';
  borderColor?: string;
  gradientBackground?: boolean;
  energyEfficiency?: string;
}

/**
 * Generate a base64-encoded SVG image data URI
 * 
 * @param options Configuration options for the SVG generation
 * @returns A data URI string that can be used directly in an img src attribute
 */
export function generateSvgImage(options: SvgImageOptions = {}): string {
  // Set default values
  const {
    text = 'Product Image',
    backgroundColor = '#EEEEEE',
    textColor = '#666666',
    width = 200,
    height = 200,
    fontSize = 12,
    icon = 'product',
    borderColor = '#DDDDDD',
    gradientBackground = true,
    energyEfficiency = ''
  } = options;

  // Create a unique gradient ID to avoid conflicts if multiple SVGs are on the page
  const gradientId = `grad-${Math.random().toString(36).substring(2, 9)}`;
  
  // Prepare the product icon path if needed
  let iconSvg = '';
  let colorBadge = '';
  
  // Add energy efficiency badge if provided
  if (energyEfficiency) {
    const efficiencyLabel = energyEfficiency.length > 10 ? 
      `${energyEfficiency.substring(0, 8)}...` : energyEfficiency;
      
    const efficiencyColor = (() => {
      if (energyEfficiency.toLowerCase().includes('high')) return '#4caf50'; // Green
      if (energyEfficiency.toLowerCase().includes('medium')) return '#ff9800'; // Orange
      if (energyEfficiency.toLowerCase().includes('low')) return '#f44336'; // Red 
      return '#4caf50'; // Default to green
    })();
    
    colorBadge = `
      <rect x="${width * 0.1}" y="${height * 0.1}" width="${width * 0.25}" height="${height * 0.08}" rx="4" fill="${efficiencyColor}" />
      <text x="${width * 0.22}" y="${height * 0.14}" font-family="Arial" font-size="${fontSize * 0.8}" fill="white" text-anchor="middle" alignment-baseline="middle">${efficiencyLabel}</text>
    `;
  }
  
  if (icon === 'product') {
    // Simple product icon (box with lines)
    iconSvg = `
      <rect x="${width * 0.3}" y="${height * 0.25}" width="${width * 0.4}" height="${height * 0.4}" stroke="${textColor}" stroke-width="3" fill="none"/>
      <line x1="${width * 0.25}" y1="${height * 0.35}" x2="${width * 0.75}" y2="${height * 0.35}" stroke="${textColor}" stroke-width="3"/>
      <line x1="${width * 0.25}" y1="${height * 0.55}" x2="${width * 0.75}" y2="${height * 0.55}" stroke="${textColor}" stroke-width="3"/>
    `;
  } else if (icon === 'category') {
    // Simple category icon (folder)
    iconSvg = `
      <path d="M${width * 0.25} ${height * 0.3} L${width * 0.4} ${height * 0.3} L${width * 0.45} ${height * 0.35} L${width * 0.75} ${height * 0.35} L${width * 0.75} ${height * 0.6} L${width * 0.25} ${height * 0.6} Z" stroke="${textColor}" stroke-width="3" fill="none"/>
    `;
  }

  // Build the SVG content
  let svgContent = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      ${gradientBackground ? `
        <defs>
          <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="${backgroundColor}" stop-opacity="1" />
            <stop offset="100%" stop-color="${borderColor}" stop-opacity="0.6" />
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#${gradientId})" />
      ` : `<rect width="${width}" height="${height}" fill="${backgroundColor}" />`}
      ${iconSvg}
      ${colorBadge}
      <text 
        x="${width / 2}" 
        y="${height * 0.75}" 
        font-family="Arial" 
        font-size="${fontSize}" 
        fill="${textColor}" 
        text-anchor="middle"
        dominant-baseline="middle"
      >
        ${text}
      </text>
    </svg>
  `;

  // Compress the SVG by removing extra whitespace
  svgContent = svgContent.replace(/\s+/g, ' ').trim();
  
  // Convert to base64 data URI
  return `data:image/svg+xml;base64,${btoa(svgContent)}`;
}

/**
 * Generate a product image based on product properties
 * 
 * @param productName The name of the product 
 * @param category Optional category for color theming
 * @param efficiency Optional energy efficiency rating
 * @returns A data URI string to use as image src
 */
export function generateProductImage(productName: string, category?: string, efficiency?: string): string {
  // Determine background color based on category (simple color coding system)
  let backgroundColor = '#EEEEEE'; // Default gray
  
  if (category) {
    const normalizedCategory = category.toLowerCase();
    
    // Define category-based colors 
    if (normalizedCategory.includes('appliance')) backgroundColor = '#E3F2FD'; // Light blue
    else if (normalizedCategory.includes('lighting')) backgroundColor = '#FFF9C4'; // Light yellow
    else if (normalizedCategory.includes('heating') || normalizedCategory.includes('cooling')) backgroundColor = '#E8F5E9'; // Light green
    else if (normalizedCategory.includes('electronic')) backgroundColor = '#F3E5F5'; // Light purple
    else if (normalizedCategory.includes('water')) backgroundColor = '#E1F5FE'; // Light cyan
    else if (normalizedCategory.includes('data')) backgroundColor = '#ECEFF1'; // Light bluish gray
  }
  
  // Generate SVG with the product info
  return generateSvgImage({
    text: productName.length > 20 ? `${productName.substring(0, 18)}...` : productName,
    backgroundColor,
    gradientBackground: true,
    icon: 'product',
    energyEfficiency: efficiency
  });
}

/**
 * Generate a category image
 * 
 * @param categoryName The name of the category
 * @returns A data URI string to use as image src
 */
export function generateCategoryImage(categoryName: string): string {
  // Generate SVG with the category info
  return generateSvgImage({
    text: categoryName,
    backgroundColor: '#F5F5F5',
    gradientBackground: true,
    icon: 'category',
    width: 400,
    height: 200,
    fontSize: 16
  });
}
