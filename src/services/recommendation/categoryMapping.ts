import { CategoryMapping } from '../productRecommendationService';

/**
 * Maps recommendation types to product categories and subcategories
 * @param type The recommendation type
 * @param title The recommendation title (optional)
 * @returns The corresponding product main category and subcategory
 */
export const mapRecommendationTypeToCategory = (type: string, title?: string): CategoryMapping => {
  // Basic category mapping
  const typeToMainCategory: Record<string, string> = {
    'hvac': 'Heating & Cooling',
    'heating': 'Heating & Cooling',
    'cooling': 'Heating & Cooling',
    'insulation': 'Building Products',
    'windows': 'Building Products',
    'doors': 'Building Products',
    'lighting': 'Lighting & Fans',
    'appliances': 'Appliances',
    'water-heating': 'Water Heaters',
    'water_heating': 'Water Heaters', // Added underscore version
    'smart-home': 'Electronics',
    'smart_home': 'Electronics', // Added underscore version
    'smart-home-devices': 'Electronics',
    'smart_home_devices': 'Electronics', // Added underscore version
    'renewable': 'Electronics',
    'renewable-energy': 'Electronics',
    'renewable_energy': 'Electronics', // Added underscore version
    'solar': 'Electronics',
    'weatherization': 'Building Products',
    'thermostat': 'Heating & Cooling',
    'humidity': 'Heating & Cooling', // Added explicit humidity type
    'dehumidification': 'Heating & Cooling'
  };

  // Subcategory mappings
  const typeToSubCategory: Record<string, Record<string, string>> = {
    'lighting': {
      'fixture': 'Light Fixtures',
      'bulb': 'Light Bulbs',
      'led': 'Light Bulbs',
      'lamp': 'Light Fixtures',
      'ceiling': 'Ceiling Fans',
      'default': 'Light Bulbs'
    },
    'hvac': {
      'furnace': 'Furnaces',
      'air conditioner': 'Air Conditioners',
      'heat pump': 'Heat Pumps',
      'thermostat': 'Thermostats',
      'default': 'HVAC Systems'
    },
    'insulation': {
      'default': 'Insulation'
    },
    'windows': {
      'default': 'Windows'
    },
    'doors': {
      'default': 'Doors'
    },
    'smart_home': {
      'default': 'Smart Home'  
    },
    'smart-home': {
      'default': 'Smart Home'
    }
  };

  // Convert to lowercase for case-insensitive matching
  const lowercaseType = type.toLowerCase();
  const lowercaseTitle = title ? title.toLowerCase() : '';
  
  // Find main category
  let mainCategory = 'General';
  for (const [key, value] of Object.entries(typeToMainCategory)) {
    if (lowercaseType.includes(key)) {
      mainCategory = value;
      break;
    }
  }
  
  // Find subcategory based on title and type
  let subCategory = '';
  
  // Special case for differentiating fixtures vs bulbs using the title
  if (lowercaseType.includes('lighting')) {
    const subCategoryMap = typeToSubCategory['lighting'] || { default: 'Light Bulbs' };
    
    // Check title for keywords if available
    if (lowercaseTitle) {
      // Check for fixture-related keywords in title
      if (lowercaseTitle.includes('fixture') || 
          lowercaseTitle.includes('ceiling') || 
          lowercaseTitle.includes('replace')) {
        subCategory = subCategoryMap['fixture'] || 'Light Fixtures';
      } 
      // Check for bulb-related keywords in title
      else if (lowercaseTitle.includes('bulb') || 
               lowercaseTitle.includes('led') || 
               lowercaseTitle.includes('lamp')) {
        subCategory = subCategoryMap['bulb'] || 'Light Bulbs';
      }
      // Check for fan-related keywords in title
      else if (lowercaseTitle.includes('fan')) {
        subCategory = subCategoryMap['ceiling'] || 'Ceiling Fans';
      }
      // Default for lighting
      else {
        subCategory = subCategoryMap['default'] || 'Light Bulbs';
      }
    } else {
      subCategory = subCategoryMap['default'] || 'Light Bulbs';
    }
  } 
  // For HVAC systems
  else if (lowercaseType.includes('hvac') || 
           lowercaseType.includes('heating') || 
           lowercaseType.includes('cooling')) {
    const subCategoryMap = typeToSubCategory['hvac'] || { default: 'HVAC Systems' };
    
    // Check title for HVAC subtypes if available
    if (lowercaseTitle) {
      if (lowercaseTitle.includes('furnace')) {
        subCategory = subCategoryMap['furnace'] || 'Furnaces';
      }
      else if (lowercaseTitle.includes('air condition')) {
        subCategory = subCategoryMap['air conditioner'] || 'Air Conditioners';
      }
      else if (lowercaseTitle.includes('heat pump')) {
        subCategory = subCategoryMap['heat pump'] || 'Heat Pumps';
      }
      else if (lowercaseTitle.includes('thermostat')) {
        subCategory = subCategoryMap['thermostat'] || 'Thermostats';
      }
      else {
        subCategory = subCategoryMap['default'] || 'HVAC Systems';
      }
    } else {
      subCategory = subCategoryMap['default'] || 'HVAC Systems';
    }
  } 
  // For insulation
  else if (lowercaseType.includes('insulation')) {
    const insulationMap = typeToSubCategory['insulation'] || { default: 'Insulation' };
    subCategory = insulationMap['default'] || 'Insulation';
  }
  // For windows
  else if (lowercaseType.includes('windows')) {
    const windowsMap = typeToSubCategory['windows'] || { default: 'Windows' };
    subCategory = windowsMap['default'] || 'Windows';
  }
  // For doors
  else if (lowercaseType.includes('doors')) {
    const doorsMap = typeToSubCategory['doors'] || { default: 'Doors' };
    subCategory = doorsMap['default'] || 'Doors';
  }
  // For Smart Home devices
  else if (lowercaseType.includes('smart_home') || lowercaseType.includes('smart-home')) {
    subCategory = 'Smart Home';
  }
  // For dehumidifiers or humidity control
  else if (lowercaseType.includes('humid') || lowercaseType.includes('humidity')) {
    subCategory = 'Dehumidifiers';
  }
  
  return {
    mainCategory,
    subCategory
  };
};
