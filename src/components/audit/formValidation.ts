import { EnergyAuditData } from '@/types/energyAudit';

// Basic Info validation
const validateBasicInfo = (data: EnergyAuditData['basicInfo']): boolean => {
  return !!(
    data.fullName &&
    data.email &&
    data.phone &&
    data.address &&
    data.propertyType &&
    data.yearBuilt &&
    data.occupants &&
    data.auditDate
  );
};

// Home Details validation
const validateHomeDetails = (data: EnergyAuditData['homeDetails']): boolean => {
  return !!(
    data.homeSize &&
    data.stories &&
    data.basementType !== undefined
  );
};

// Current Conditions validation
const validateCurrentConditions = (data: EnergyAuditData['currentConditions']): boolean => {
  return !!(
    data.temperatureConsistency &&
    data.windowCount &&
    data.airLeaks?.length >= 0
  );
};

// Lighting validation
const validateLighting = (data: EnergyAuditData['currentConditions']): boolean => {
  return !!(
    data.primaryBulbType &&
    data.naturalLight &&
    data.lightingControls
  );
};

// HVAC validation
const validateHVAC = (data: EnergyAuditData['heatingCooling']): boolean => {
  return !!(
    data.heatingSystem.type &&
    data.coolingSystem.type &&
    data.systemPerformance &&
    data.thermostatType
  );
};

// Energy Use validation
const validateEnergyUse = (data: EnergyAuditData['energyConsumption']): boolean => {
  return !!(
    data.occupancyPattern &&
    data.seasonalVariation &&
    data.monthlyBill
  );
};

// Product Preferences validation
const validateProductPreferences = (data: EnergyAuditData['productPreferences']): boolean => {
  if (!data) return false;
  
  return !!(
    data.categories &&
    data.categories.length > 0 &&
    data.budgetConstraint
  );
};

// Validate a specific section
export const validateSection = (
  section: keyof EnergyAuditData | 'lighting' | 'productPreferences',
  data: EnergyAuditData
): string[] => {
  return getSectionErrors(section, data);
};

// Get validation errors for a section
export const getSectionErrors = (
  section: keyof EnergyAuditData | 'lighting' | 'productPreferences',
  data: EnergyAuditData
): string[] => {
  const errors: string[] = [];

  switch (section) {
    case 'basicInfo':
      if (!data.basicInfo.fullName) errors.push('Full name is required');
      if (!data.basicInfo.email) errors.push('Email is required');
      if (!data.basicInfo.phone) errors.push('Phone number is required');
      if (!data.basicInfo.address) errors.push('Address is required');
      if (!data.basicInfo.propertyType) errors.push('Property type is required');
      if (!data.basicInfo.yearBuilt) errors.push('Year built is required');
      if (!data.basicInfo.occupants) errors.push('Number of occupants is required');
      break;

    case 'homeDetails':
      if (!data.homeDetails.homeSize) errors.push('Home size is required');
      if (!data.homeDetails.stories) errors.push('Number of stories is required');
      if (!data.homeDetails.squareFootage) errors.push('Square footage is required');
      break;

    case 'currentConditions':
      if (!data.currentConditions.temperatureConsistency) errors.push('Temperature consistency is required');
      if (!data.currentConditions.windowCount) errors.push('Window count is required');
      break;
      
    case 'lighting':
      if (!data.currentConditions.primaryBulbType) errors.push('Primary bulb type is required');
      if (!data.currentConditions.naturalLight) errors.push('Natural light assessment is required');
      if (!data.currentConditions.lightingControls) errors.push('Lighting controls information is required');
      break;

    case 'heatingCooling':
      if (!data.heatingCooling.heatingSystem.type) errors.push('Heating system type is required');
      if (!data.heatingCooling.coolingSystem.type) errors.push('Cooling system type is required');
      if (!data.heatingCooling.systemPerformance) errors.push('System performance is required');
      if (!data.heatingCooling.thermostatType) errors.push('Thermostat type is required');
      break;

    case 'energyConsumption':
      if (!data.energyConsumption.occupancyPattern) errors.push('Occupancy pattern is required');
      if (!data.energyConsumption.seasonalVariation) errors.push('Seasonal variation is required');
      if (!data.energyConsumption.monthlyBill) errors.push('Monthly bill range is required');
      break;
      
    case 'productPreferences':
      if (!data.productPreferences) errors.push('Product preferences are required');
      else {
        if (!data.productPreferences.categories || data.productPreferences.categories.length === 0) {
          errors.push('At least one product category is required');
        }
        if (!data.productPreferences.budgetConstraint) errors.push('Budget constraint is required');
      }
      break;
  }

  return errors;
};

// Map section number to section key
export const getSectionKey = (step: number): keyof EnergyAuditData | 'lighting' | 'productPreferences' => {
  switch (step) {
    case 1:
      return 'basicInfo';
    case 2:
      return 'homeDetails';
    case 3:
      return 'currentConditions';
    case 4:
      return 'heatingCooling';
    case 5:
      return 'energyConsumption';
    case 6:
      return 'lighting';
    case 7:
      return 'productPreferences';
    default:
      return 'basicInfo'; // Default to first section
  }
};

// Get the section name for display purposes
export const getSectionName = (step: number): string => {
  switch (step) {
    case 1:
      return 'Basic Info';
    case 2:
      return 'Home Details';
    case 3:
      return 'Current Conditions';
    case 4:
      return 'HVAC Systems';
    case 5:
      return 'Energy Usage';
    case 6:
      return 'Lighting';
    case 7:
      return 'Product Preferences';
    default:
      return 'Basic Info';
  }
};
