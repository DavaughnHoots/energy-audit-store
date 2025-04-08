/**
 * Default Financial Values Utility
 * 
 * Provides realistic financial values for energy efficiency recommendations
 * when actual values are not available from the API. These values can be
 * used to populate recommendation cards and charts with plausible data.
 */

// Default savings estimates by recommendation type
export const DEFAULT_SAVINGS_BY_TYPE: Record<string, number> = {
  hvac: 520,          // HVAC systems typically save $520/year
  lighting: 180,      // Lighting upgrades typically save $180/year
  insulation: 230,    // Insulation improvements typically save $230/year
  windows: 310,       // Window upgrades typically save $310/year
  appliances: 120,    // Energy-efficient appliances typically save $120/year
  water_heating: 140, // Water heating efficiency typically saves $140/year
  renewable: 850,     // Renewable energy typically saves $850/year
  smart_home: 90,     // Smart home devices typically save $90/year
  humidity: 70,       // Humidity control typically saves $70/year
  default: 200        // Default value if type is not recognized
};

// Default implementation costs by recommendation type
export const DEFAULT_COSTS_BY_TYPE: Record<string, number> = {
  hvac: 3800,         // HVAC replacement typically costs $3,800
  lighting: 350,      // Lighting upgrades typically cost $350
  insulation: 1200,   // Insulation upgrades typically cost $1,200
  windows: 4500,      // Window replacements typically cost $4,500
  appliances: 800,    // Energy-efficient appliance upgrades typically cost $800
  water_heating: 950, // Water heater upgrades typically cost $950
  renewable: 12000,   // Renewable energy systems typically cost $12,000
  smart_home: 350,    // Smart home device installations typically cost $350
  humidity: 400,      // Humidity control systems typically cost $400
  default: 1000       // Default value if type is not recognized
};

// Default payback periods (years) by recommendation type
export const DEFAULT_PAYBACK_BY_TYPE: Record<string, number> = {
  hvac: 7.3,          // HVAC systems typically have a 7.3 year payback
  lighting: 1.9,      // Lighting upgrades typically have a 1.9 year payback
  insulation: 5.2,    // Insulation improvements typically have a 5.2 year payback
  windows: 14.5,      // Window upgrades typically have a 14.5 year payback
  appliances: 6.7,    // Appliance upgrades typically have a 6.7 year payback
  water_heating: 6.8, // Water heating improvements typically have a 6.8 year payback
  renewable: 14.1,    // Renewable energy typically has a 14.1 year payback
  smart_home: 3.9,    // Smart home devices typically have a 3.9 year payback
  humidity: 5.7,      // Humidity control typically has a 5.7 year payback
  default: 5.0        // Default value if type is not recognized
};

/**
 * Helper function to get default financial values for a recommendation
 * based on its type. Returns reasonable values when actual data is not available.
 */
export function getDefaultFinancialValues(type: string) {
  const normType = type?.toLowerCase() || 'default';
  
  return {
    estimatedSavings: DEFAULT_SAVINGS_BY_TYPE[normType] || DEFAULT_SAVINGS_BY_TYPE.default,
    estimatedCost: DEFAULT_COSTS_BY_TYPE[normType] || DEFAULT_COSTS_BY_TYPE.default,
    paybackPeriod: DEFAULT_PAYBACK_BY_TYPE[normType] || DEFAULT_PAYBACK_BY_TYPE.default,
  };
}

/**
 * Enriches recommendations with default financial values when
 * actual values are missing or zero.
 */
export function enrichRecommendationWithDefaultValues(recommendation: any): any {
  if (!recommendation) return recommendation;
  
  // Get default financial values based on recommendation type
  const defaults = getDefaultFinancialValues(recommendation.type);
  
  return {
    ...recommendation,
    // Use actual values if they exist and are non-zero, otherwise use defaults
    estimatedSavings: recommendation.estimatedSavings || defaults.estimatedSavings,
    implementationCost: recommendation.implementationCost || recommendation.estimatedCost || defaults.estimatedCost,
    estimatedCost: recommendation.estimatedCost || recommendation.implementationCost || defaults.estimatedCost,
    paybackPeriod: recommendation.paybackPeriod || defaults.paybackPeriod,
    actualSavings: recommendation.actualSavings || 0, // Keep actual savings as 0 if not available
  };
}

/**
 * Enriches chart data points with default financial values based on recommendation name.
 */
export function enrichChartDataWithDefaultValues(chartItem: any): any {
  if (!chartItem) return chartItem;
  
  // Try to determine type from name
  let itemType = 'default';
  const name = chartItem.name?.toLowerCase() || '';
  
  if (name.includes('hvac')) itemType = 'hvac';
  else if (name.includes('light')) itemType = 'lighting';
  else if (name.includes('insul')) itemType = 'insulation';
  else if (name.includes('window')) itemType = 'windows';
  else if (name.includes('appliance')) itemType = 'appliances';
  else if (name.includes('water')) itemType = 'water_heating';
  else if (name.includes('solar') || name.includes('renewable')) itemType = 'renewable';
  else if (name.includes('smart')) itemType = 'smart_home';
  else if (name.includes('humid')) itemType = 'humidity';
  
  // Get default values
  const defaults = getDefaultFinancialValues(itemType);
  
  return {
    ...chartItem,
    // Use actual values if they exist and are non-zero, otherwise use defaults
    estimatedSavings: (chartItem.estimatedSavings && chartItem.estimatedSavings > 0) 
      ? chartItem.estimatedSavings 
      : defaults.estimatedSavings,
    actualSavings: (chartItem.actualSavings && chartItem.actualSavings > 0)
      ? chartItem.actualSavings
      : 0, // Keep actual as 0 when not available
  };
}
