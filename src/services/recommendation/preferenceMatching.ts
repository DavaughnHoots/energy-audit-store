/**
 * Maps user preference strings to category names
 * This helps bridge the gap between UI preference strings and internal category names
 */
export const userPreferenceToCategory: Record<string, string[]> = {
  // HVAC Systems
  'hvac': ['Heating & Cooling', 'HVAC Systems', 'Furnaces', 'Air Conditioners', 'Heat Pumps', 'Thermostats', 'hvac'],
  'heating': ['Heating & Cooling', 'HVAC Systems', 'Furnaces', 'Heat Pumps', 'heating'],
  'cooling': ['Heating & Cooling', 'HVAC Systems', 'Air Conditioners', 'cooling'],
  // Lighting
  'lighting': ['Lighting & Fans', 'Light Bulbs', 'Light Fixtures', 'Ceiling Fans', 'lighting'],
  // Insulation
  'insulation': ['Building Products', 'Insulation', 'insulation'],
  // Windows & Doors
  'windows': ['Building Products', 'Windows', 'windows'],
  'doors': ['Building Products', 'Doors', 'doors'],
  'windows_doors': ['Building Products', 'Windows', 'Doors', 'windows', 'doors'],
  'windows-doors': ['Building Products', 'Windows', 'Doors', 'windows', 'doors'],
  // Appliances
  'appliances': ['Appliances', 'appliances'],
  'energy-efficient_appliances': ['Appliances', 'appliances'],
  'energy-efficient-appliances': ['Appliances', 'appliances'],
  'energy_efficient_appliances': ['Appliances', 'appliances'],
  // Water Heating - this was in the filtered logs as a key issue
  'water_heating': ['Water Heaters', 'water_heating', 'water-heating', 'water heating'],
  'water-heating': ['Water Heaters', 'water_heating', 'water-heating', 'water heating'],
  // Smart Home - this was in the filtered logs as a key issue
  'smart_home': ['Electronics', 'Smart Home', 'smart_home', 'smart-home', 'smart_home_devices', 'smart-home-devices'],
  'smart-home': ['Electronics', 'Smart Home', 'smart_home', 'smart-home', 'smart_home_devices', 'smart-home-devices'],
  'smart_home_devices': ['Electronics', 'Smart Home', 'smart_home', 'smart-home', 'smart_home_devices', 'smart-home-devices'],
  'smart-home-devices': ['Electronics', 'Smart Home', 'smart_home', 'smart-home', 'smart_home_devices', 'smart-home-devices'],
  // Renewable Energy - this was in the filtered logs as a key issue
  'renewable': ['Electronics', 'Renewable Energy', 'Solar', 'renewable', 'renewable_energy', 'renewable-energy'],
  'renewable_energy': ['Electronics', 'Renewable Energy', 'Solar', 'renewable', 'renewable_energy', 'renewable-energy'],
  'renewable-energy': ['Electronics', 'Renewable Energy', 'Solar', 'renewable', 'renewable_energy', 'renewable-energy'],
  'solar': ['Electronics', 'Solar', 'renewable', 'solar'],
  // Dehumidification - adding this to match the humidity type
  'humidity': ['Heating & Cooling', 'Dehumidifiers', 'humidity', 'dehumidification'],
  'dehumidification': ['Heating & Cooling', 'Dehumidifiers', 'humidity', 'dehumidification']
};

/**
 * Checks if a user preference matches a category
 * @param preference User preference string
 * @param category Category name to match against
 * @returns Whether there's a match
 */
export const isPreferenceMatchingCategory = (preference: string, category: string): boolean => {
  // Log for debugging purposes
  console.log(`Checking if preference '${preference}' matches category '${category}'`);
  
  // Guard against empty categories
  if (!category || category.trim() === '') {
    console.log(`Skipping match check with empty category for preference '${preference}'`);
    return false;
  }
  
  // Special case direct matches for problematic categories
  // These are the exact combinations that are failing in the logs
  if ((preference === 'renewable' && 
       (category === 'renewable' || 
        category === 'renewable_energy' || 
        category === 'renewable-energy' || 
        category === 'Electronics')) ||
      (preference === 'smart_home' && 
       (category === 'smart_home' || 
        category === 'smart-home' || 
        category === 'smart_home_devices' || 
        category === 'Electronics')) ||
      (preference === 'water_heating' && 
       (category === 'water_heating' || 
        category === 'water-heating' || 
        category === 'Water Heaters'))) {
    console.log(`DIRECT TYPE MATCH found for '${preference}' and '${category}'`);
    return true;
  }
  
  // Direct match (case-insensitive)
  if (preference.toLowerCase() === category.toLowerCase()) {
    console.log(`Direct match found for '${preference}' and '${category}'`);
    return true;
  }
  
  // Check if category contains the preference (e.g., "HVAC Systems" contains "hvac")
  if (category.toLowerCase().includes(preference.toLowerCase()) || 
      preference.toLowerCase().includes(category.toLowerCase())) {
    console.log(`Substring match found between '${preference}' and '${category}'`);
    return true;
  }
  
  // Check if preference is a known key with mapped categories
  const mappedCategories = userPreferenceToCategory[preference.toLowerCase()];
  if (mappedCategories) {
    // First check exact matches
    const exactMatch = mappedCategories.some(mappedCat => 
      mappedCat.toLowerCase() === category.toLowerCase()
    );
    
    if (exactMatch) {
      console.log(`Mapped exact match found for preference '${preference}' in category '${category}'`);
      return true;
    }
    
    // Then check substring matches
    const substringMatch = mappedCategories.some(mappedCat => 
      category.toLowerCase().includes(mappedCat.toLowerCase()) ||
      mappedCat.toLowerCase().includes(category.toLowerCase())
    );
    
    if (substringMatch) {
      console.log(`Mapped substring match found for preference '${preference}' in category '${category}'`);
      return true;
    }
  }
  
  // Handle special case for underscores vs dashes
  const normalizedPreference = preference.toLowerCase().replace(/_/g, '-');
  if (normalizedPreference !== preference.toLowerCase()) {
    const mappedCategories = userPreferenceToCategory[normalizedPreference];
    if (mappedCategories) {
      const hasMatch = mappedCategories.some(mappedCat => 
        mappedCat.toLowerCase() === category.toLowerCase() ||
        category.toLowerCase().includes(mappedCat.toLowerCase()) ||
        mappedCat.toLowerCase().includes(category.toLowerCase())
      );
      if (hasMatch) {
        console.log(`Normalized match found for '${preference}' using '${normalizedPreference}'`);
        return true;
      }
    }
  }
  
  // Handle special case for dashes vs underscores (inverse of above)
  const dashedPreference = preference.toLowerCase().replace(/-/g, '_');
  if (dashedPreference !== preference.toLowerCase()) {
    const mappedCategories = userPreferenceToCategory[dashedPreference];
    if (mappedCategories) {
      const hasMatch = mappedCategories.some(mappedCat => 
        mappedCat.toLowerCase() === category.toLowerCase() ||
        category.toLowerCase().includes(mappedCat.toLowerCase()) ||
        mappedCat.toLowerCase().includes(category.toLowerCase())
      );
      if (hasMatch) {
        console.log(`Dashed match found for '${preference}' using '${dashedPreference}'`);
        return true;
      }
    }
  }
  
  // Try to match by word or phrase (e.g., "renewable" with "Renewable Energy")
  if (category.toLowerCase().split(/\s+/).includes(preference.toLowerCase()) ||
      preference.toLowerCase().split(/\s+/).some(word => category.toLowerCase().includes(word))) {
    console.log(`Word match found between '${preference}' and '${category}'`);
    return true;
  }
  
  console.log(`No match found between '${preference}' and '${category}'`);
  return false;
};
