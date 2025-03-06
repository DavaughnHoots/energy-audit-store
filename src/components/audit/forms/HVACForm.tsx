import React, { useState, ChangeEvent } from 'react';
import { HeatingCooling } from '@/types/energyAudit';
import { Fan } from 'lucide-react';
import { HVACFormProps } from './types';
import FormSection, { FormSectionAdvanced } from '../FormSection';
import { FormGrid, SelectField, InputField, FormSubsection } from '../FormFields';
import {
  heatingSystemDefaults,
  coolingSystemDefaults,
  systemPerformanceDefaults,
  thermostatDefaults,
  efficiencyRanges
} from './hvacDefaults';

const HVACForm: React.FC<HVACFormProps> = ({
  data,
  onInputChange
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [userModified, setUserModified] = useState<Record<string, boolean>>({});
  const [efficiencyError, setEfficiencyError] = useState<string | undefined>(undefined);

  // Helper function to update a field if it hasn't been modified by the user
  const updateIfNotModified = (field: keyof HeatingCooling, subfield: string, value: any) => {
    const key = `${field}.${subfield}`;
    if (!userModified[key]) {
      if (field === 'heatingSystem') {
        onInputChange(field, {
          ...data.heatingSystem,
          [subfield]: value
        });
      } else if (field === 'coolingSystem') {
        onInputChange(field, {
          ...data.coolingSystem,
          [subfield]: value
        });
      } else {
        onInputChange(field, value);
      }
    }
  };

  // Get efficiency range and unit for a system type
  const getEfficiencyRange = (systemType: string, isHeating: boolean) => {
    if (systemType === 'heat-pump') {
      return isHeating ? efficiencyRanges.heatPump.heating : efficiencyRanges.heatPump.cooling;
    }
    
    const ranges = {
      'furnace': efficiencyRanges.furnace,
      'boiler': efficiencyRanges.boiler,
      'central-heating': efficiencyRanges.centralHeating,
      'central-ac': efficiencyRanges.centralAC,
      'mini-split': efficiencyRanges.miniSplit,
      'window-units': efficiencyRanges.windowUnit
    } as const;

    return ranges[systemType as keyof typeof ranges];
  };

  // Validate efficiency rating based on system type
  const validateEfficiency = (systemType: string, efficiency: number, isHeating: boolean): boolean => {
    const range = getEfficiencyRange(systemType, isHeating);
    return range ? efficiency >= range.min && efficiency <= range.max : true;
  };

  // Handle basic field changes and update related advanced fields
  const handleBasicFieldChange = (field: keyof HeatingCooling, value: any): void => {
    if (field === 'heatingSystem') {
      const defaults = heatingSystemDefaults[value.type as keyof typeof heatingSystemDefaults];
      if (defaults) {
        onInputChange('heatingSystem', {
          ...data.heatingSystem,
          type: value.type,
          fuel: defaults.fuel,
          efficiency: defaults.efficiency,
          age: defaults.age,
          lastService: defaults.lastService
        });
      }
    } else if (field === 'coolingSystem') {
      const defaults = coolingSystemDefaults[value.type as keyof typeof coolingSystemDefaults];
      if (defaults) {
        onInputChange('coolingSystem', {
          ...data.coolingSystem,
          type: value.type,
          efficiency: defaults.efficiency,
          age: defaults.age
        });
      }
    } else if (field === 'systemPerformance') {
      const defaults = systemPerformanceDefaults[value as keyof typeof systemPerformanceDefaults];
      if (defaults) {
        // Adjust efficiencies based on performance
        if (data.heatingSystem.efficiency) {
          updateIfNotModified('heatingSystem', 'efficiency', 
            Math.round(data.heatingSystem.efficiency * defaults.heatingEfficiencyMultiplier)
          );
        }
        if (data.coolingSystem.efficiency) {
          updateIfNotModified('coolingSystem', 'efficiency',
            Math.round(data.coolingSystem.efficiency * defaults.coolingEfficiencyMultiplier)
          );
        }
      }
      onInputChange(field, value);
    } else if (field === 'thermostatType') {
      const defaults = thermostatDefaults[value as keyof typeof thermostatDefaults];
      if (defaults) {
        updateIfNotModified('zoneCount', '', defaults.zoneCount);
      }
      onInputChange(field, value);
    } else {
      onInputChange(field, value);
    }
  };

  // Handle advanced field changes
  const handleAdvancedFieldChange = (field: keyof HeatingCooling, subfield: string, value: any): void => {
    const key = `${field}.${subfield}`;
    setUserModified(prev => ({ ...prev, [key]: true }));

    // Validate efficiency ratings
    if (subfield === 'efficiency') {
      const isHeating = field === 'heatingSystem';
      const systemType = field === 'heatingSystem' 
        ? data.heatingSystem.type 
        : data.coolingSystem.type;
      const isValid = validateEfficiency(systemType, value, isHeating);
      
      if (!isValid) {
        const range = getEfficiencyRange(systemType, isHeating);
        if (range) {
          setEfficiencyError(
            `Invalid ${range.unit} rating. Must be between ${range.min} and ${range.max}.`
          );
          return;
        }
      }
      setEfficiencyError(undefined);
    }

    if (field === 'heatingSystem') {
      onInputChange(field, {
        ...data.heatingSystem,
        [subfield]: value
      });
    } else if (field === 'coolingSystem') {
      onInputChange(field, {
        ...data.coolingSystem,
        [subfield]: value
      });
    } else {
      onInputChange(field, value);
    }
  };

  return (
    <FormSection
      title="HVAC Systems"
      description="Tell us about your heating, cooling, and ventilation systems."
      icon={Fan}
      showAdvanced={showAdvanced}
      onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
    >
      {/* Basic Fields */}
      <FormGrid>
        <SelectField
          label="Heating System Type"
          value={data.heatingSystem.type}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => handleBasicFieldChange('heatingSystem', { type: e.target.value })}
          options={[
            { value: 'furnace', label: 'Furnace' },
            { value: 'heat-pump', label: 'Heat Pump' },
            { value: 'boiler', label: 'Boiler' },
            { value: 'central-heating', label: 'Central Heating' },
            { value: 'electric-baseboard', label: 'Electric Baseboard' },
            { value: 'not-sure', label: 'Not Sure' }
          ]}
          required
        />

        <SelectField
          label="Cooling System Type"
          value={data.coolingSystem.type}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => handleBasicFieldChange('coolingSystem', { type: e.target.value })}
          options={[
            { value: 'central-ac', label: 'Central AC' },
            { value: 'heat-pump', label: 'Heat Pump' },
            { value: 'mini-split', label: 'Mini Split' },
            { value: 'window-units', label: 'Window Units' },
            { value: 'none', label: 'No Cooling System' }
          ]}
          required
        />

        <SelectField
          label="System Performance"
          value={data.systemPerformance}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => handleBasicFieldChange('systemPerformance', e.target.value)}
          options={[
            { value: 'works-well', label: 'Works well (no issues)' },
            { value: 'some-problems', label: 'Some problems (occasional issues)' },
            { value: 'needs-attention', label: 'Needs attention (frequent issues)' }
          ]}
          required
        />

        <SelectField
          label="Thermostat Type"
          value={data.thermostatType}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => handleBasicFieldChange('thermostatType', e.target.value)}
          options={[
            { value: 'manual', label: 'Manual' },
            { value: 'programmable', label: 'Programmable' },
            { value: 'smart', label: 'Smart/WiFi' },
            { value: 'not-sure', label: 'Not Sure' }
          ]}
          required
        />

        <SelectField
          label="Temperature Difference"
          value={data.temperatureDifferenceCategory || ''}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => handleBasicFieldChange('temperatureDifferenceCategory', e.target.value)}
          options={[
            { value: 'small', label: 'Small (less than 10°F/5°C difference)' },
            { value: 'moderate', label: 'Moderate (10-20°F/5-10°C difference)' },
            { value: 'large', label: 'Large (20-30°F/10-15°C difference)' },
            { value: 'extreme', label: 'Extreme (more than 30°F/15°C difference)' }
          ]}
          helpText="Typical temperature difference between inside and outside during heating/cooling seasons"
        />
      </FormGrid>

      {/* Advanced Fields */}
      {showAdvanced && (
        <FormSectionAdvanced>
          {/* Heating System Details */}
          <FormSubsection title="Heating System Details">
            <FormGrid>
              <SelectField
                label="Fuel Type"
                value={data.heatingSystem.fuel}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => handleAdvancedFieldChange('heatingSystem', 'fuel', e.target.value)}
                options={[
                  { value: 'natural-gas', label: 'Natural Gas' },
                  { value: 'electricity', label: 'Electricity' },
                  { value: 'oil', label: 'Oil' },
                  { value: 'propane', label: 'Propane' }
                ]}
              />

                <InputField
                  label="System Age (years)"
                  type="text"
                  value={data.heatingSystem.age || ''}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const inputValue = e.target.value;
                    if (inputValue === '') {
                      handleAdvancedFieldChange('heatingSystem', 'age', '');
                    } else if (/^\d+$/.test(inputValue)) {
                      const value = parseInt(inputValue);
                      handleAdvancedFieldChange('heatingSystem', 'age', value);
                    }
                  }}
                  onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                    const value = parseInt(e.target.value);
                    if (isNaN(value) || value < 0 || value > 50) {
                      // Could add visual feedback here if needed
                    }
                  }}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  helpText="Age of system (0-50 years)"
                />

                <InputField
                  label="Efficiency Rating"
                  type="text"
                  value={data.heatingSystem.efficiency || ''}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const inputValue = e.target.value;
                    if (inputValue === '') {
                      handleAdvancedFieldChange('heatingSystem', 'efficiency', '');
                    } else if (/^\d+$/.test(inputValue)) {
                      const value = parseInt(inputValue);
                      handleAdvancedFieldChange('heatingSystem', 'efficiency', value);
                    }
                  }}
                  onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                    const value = parseInt(e.target.value);
                    if (isNaN(value) || value < 0 || value > 400) {
                      // Could add visual feedback here if needed
                    }
                  }}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  error={efficiencyError}
                  helpText={data.heatingSystem.type === 'heat-pump'
                    ? 'HSPF for heat pumps (8-13)'
                    : 'AFUE for furnaces/boilers (80-98)'}
                />

              <InputField
                label="Last Service Date"
                type="date"
                value={data.heatingSystem.lastService || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleAdvancedFieldChange('heatingSystem', 'lastService', e.target.value)}
              />

              <InputField
                label="Output Capacity (BTU/hr)"
                type="text"
                value={data.heatingSystem.outputCapacity || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const inputValue = e.target.value;
                  if (inputValue === '') {
                    handleAdvancedFieldChange('heatingSystem', 'outputCapacity', '');
                  } else if (/^\d+$/.test(inputValue)) {
                    const value = parseInt(inputValue);
                    handleAdvancedFieldChange('heatingSystem', 'outputCapacity', value);
                  }
                }}
                pattern="[0-9]*"
                inputMode="numeric"
                helpText="Heating output capacity in BTU/hr (e.g., 60000 for a 60,000 BTU furnace)"
              />

              <InputField
                label="Input Power (kW)"
                type="text"
                value={data.heatingSystem.inputPower || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const inputValue = e.target.value;
                  if (inputValue === '') {
                    handleAdvancedFieldChange('heatingSystem', 'inputPower', '');
                  } else if (/^\d*\.?\d*$/.test(inputValue)) {
                    const value = parseFloat(inputValue);
                    handleAdvancedFieldChange('heatingSystem', 'inputPower', value);
                  }
                }}
                pattern="[0-9]*\.?[0-9]*"
                inputMode="decimal"
                helpText="Power consumption in kilowatts"
              />

              <InputField
                label="Target Efficiency (%)"
                type="text"
                value={data.heatingSystem.targetEfficiency || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const inputValue = e.target.value;
                  if (inputValue === '') {
                    handleAdvancedFieldChange('heatingSystem', 'targetEfficiency', '');
                  } else if (/^\d*\.?\d*$/.test(inputValue)) {
                    const value = parseFloat(inputValue);
                    handleAdvancedFieldChange('heatingSystem', 'targetEfficiency', value);
                  }
                }}
                pattern="[0-9]*\.?[0-9]*"
                inputMode="decimal"
                helpText="Target efficiency percentage for system upgrades (e.g., 95 for 95% AFUE)"
              />
            </FormGrid>
          </FormSubsection>

          {/* Cooling System Details */}
          {data.coolingSystem.type !== 'none' && (
            <FormSubsection title="Cooling System Details">
              <FormGrid>
                <InputField
                  label="System Age (years)"
                  type="text"
                  value={data.coolingSystem.age || ''}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const inputValue = e.target.value;
                    if (inputValue === '') {
                      handleAdvancedFieldChange('coolingSystem', 'age', '');
                    } else if (/^\d+$/.test(inputValue)) {
                      const value = parseInt(inputValue);
                      handleAdvancedFieldChange('coolingSystem', 'age', value);
                    }
                  }}
                  onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                    const value = parseInt(e.target.value);
                    if (isNaN(value) || value < 0 || value > 50) {
                      // Could add visual feedback here if needed
                    }
                  }}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  helpText="Age of system (0-50 years)"
                />

                <InputField
                  label="Efficiency Rating"
                  type="text"
                  value={data.coolingSystem.efficiency || ''}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const inputValue = e.target.value;
                    if (inputValue === '') {
                      handleAdvancedFieldChange('coolingSystem', 'efficiency', '');
                    } else if (/^\d+$/.test(inputValue)) {
                      const value = parseInt(inputValue);
                      handleAdvancedFieldChange('coolingSystem', 'efficiency', value);
                    }
                  }}
                  onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                    const value = parseInt(e.target.value);
                    if (isNaN(value) || value < 0 || value > 30) {
                      // Could add visual feedback here if needed
                    }
                  }}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  error={efficiencyError}
                  helpText={data.coolingSystem.type === 'window-units'
                    ? 'EER for window units (9.8-12)'
                    : 'SEER rating (13-21 for central AC/heat pump, 15-30 for mini-splits)'}
                />

                <InputField
                  label="Output Capacity (BTU/hr)"
                  type="text"
                  value={data.coolingSystem.outputCapacity || ''}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const inputValue = e.target.value;
                    if (inputValue === '') {
                      handleAdvancedFieldChange('coolingSystem', 'outputCapacity', '');
                    } else if (/^\d+$/.test(inputValue)) {
                      const value = parseInt(inputValue);
                      handleAdvancedFieldChange('coolingSystem', 'outputCapacity', value);
                    }
                  }}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  helpText="Cooling output capacity in BTU/hr (e.g., 24000 for a 2-ton AC unit)"
                />

                <InputField
                  label="Input Power (kW)"
                  type="text"
                  value={data.coolingSystem.inputPower || ''}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const inputValue = e.target.value;
                    if (inputValue === '') {
                      handleAdvancedFieldChange('coolingSystem', 'inputPower', '');
                    } else if (/^\d*\.?\d*$/.test(inputValue)) {
                      const value = parseFloat(inputValue);
                      handleAdvancedFieldChange('coolingSystem', 'inputPower', value);
                    }
                  }}
                  pattern="[0-9]*\.?[0-9]*"
                  inputMode="decimal"
                  helpText="Power consumption in kilowatts"
                />

                <InputField
                  label="Target Efficiency (SEER)"
                  type="text"
                  value={data.coolingSystem.targetEfficiency || ''}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const inputValue = e.target.value;
                    if (inputValue === '') {
                      handleAdvancedFieldChange('coolingSystem', 'targetEfficiency', '');
                    } else if (/^\d*\.?\d*$/.test(inputValue)) {
                      const value = parseFloat(inputValue);
                      handleAdvancedFieldChange('coolingSystem', 'targetEfficiency', value);
                    }
                  }}
                  pattern="[0-9]*\.?[0-9]*"
                  inputMode="decimal"
                  helpText="Target efficiency for system upgrades (e.g., 16 for 16 SEER)"
                />
              </FormGrid>
            </FormSubsection>
          )}

          {/* Zone Control */}
          <FormSubsection title="Zone Control">
            <FormGrid>
              <InputField
                label="Number of HVAC Zones"
                type="text"
                value={data.zoneCount || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const inputValue = e.target.value;
                  if (inputValue === '') {
                    handleBasicFieldChange('zoneCount', '');
                  } else if (/^\d+$/.test(inputValue)) {
                    const value = parseInt(inputValue);
                    handleBasicFieldChange('zoneCount', value);
                  }
                }}
                onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                  const value = parseInt(e.target.value);
                  if (isNaN(value) || value < 1 || value > 10) {
                    // Could add visual feedback here if needed
                  }
                }}
                pattern="[0-9]*"
                inputMode="numeric"
                helpText="Number of independently controlled heating/cooling zones (1-10)"
              />

              <InputField
                label="Exact Temperature Difference (°F)"
                type="text"
                value={data.temperatureDifference || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const inputValue = e.target.value;
                  if (inputValue === '') {
                    handleAdvancedFieldChange('temperatureDifference', '', '');
                  } else if (/^\d*\.?\d*$/.test(inputValue)) {
                    const value = parseFloat(inputValue);
                    handleAdvancedFieldChange('temperatureDifference', '', value);
                    
                    // Update the category based on the exact value
                    let category: 'small' | 'moderate' | 'large' | 'extreme';
                    if (value < 10) {
                      category = 'small';
                    } else if (value < 20) {
                      category = 'moderate';
                    } else if (value < 30) {
                      category = 'large';
                    } else {
                      category = 'extreme';
                    }
                    
                    // Only update if the user hasn't explicitly chosen a category
                    if (!userModified['temperatureDifferenceCategory']) {
                      handleBasicFieldChange('temperatureDifferenceCategory', category);
                    }
                  }
                }}
                pattern="[0-9]*\.?[0-9]*"
                inputMode="decimal"
                helpText="Precise temperature difference between indoor and outdoor (°F)"
              />
            </FormGrid>
          </FormSubsection>
        </FormSectionAdvanced>
      )}
    </FormSection>
  );
};

export default HVACForm;
