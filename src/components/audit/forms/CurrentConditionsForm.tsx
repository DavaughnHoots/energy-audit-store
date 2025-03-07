import React, { useState } from 'react';
import { Thermometer } from 'lucide-react';
import { CurrentConditionsFormProps } from './types';
import FormSection, { FormSectionAdvanced } from '../FormSection';
import { FormGrid, SelectField, CheckboxGroup, FormSubsection, InputField } from '../FormFields';
import {
  windowCountDefaults,
  temperatureConsistencyDefaults,
  airLeakOptions
} from './conditionDefaults';

const CurrentConditionsForm: React.FC<CurrentConditionsFormProps> = ({
  data,
  onInputChange,
  autofilledFields = []
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleBasicChange = (field: keyof typeof data) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = e.target.type === 'number' ? parseInt(e.target.value) : e.target.value;
    onInputChange(field, value);

    // Update advanced fields based on temperature consistency
    if (field === 'temperatureConsistency') {
      const defaults = temperatureConsistencyDefaults[value as keyof typeof temperatureConsistencyDefaults];
      if (defaults) {
        onInputChange('insulation', defaults.insulation);
        onInputChange('windowCondition', defaults.windowCondition);
        onInputChange('weatherStripping', defaults.weatherStripping);
        onInputChange('airLeaks', defaults.airLeaks);
      }
    }

    // Update advanced fields based on window count
    if (field === 'windowCount') {
      const defaults = windowCountDefaults[value as keyof typeof windowCountDefaults];
      if (defaults) {
        onInputChange('numWindows', defaults.numWindows);
        onInputChange('windowType', defaults.windowType);
        onInputChange('windowCondition', defaults.windowCondition);
        onInputChange('weatherStripping', defaults.weatherStripping);
      }
    }
  };

  const handleAdvancedChange = (field: keyof typeof data) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = e.target.type === 'number' ? parseInt(e.target.value) : e.target.value;
    onInputChange(field, value);
  };

  const handleInsulationChange = (area: keyof typeof data.insulation) => (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    onInputChange('insulation', {
      ...data.insulation,
      [area]: e.target.value
    });
  };

  return (
    <FormSection
      title="Current Conditions"
      description="Tell us about your home's current condition and comfort level."
      icon={Thermometer}
      showAdvanced={showAdvanced}
      onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
    >
      {/* Basic Fields */}
      <FormGrid>
        <SelectField
          label="Temperature Consistency Throughout Home"
          value={data.temperatureConsistency}
          onChange={handleBasicChange('temperatureConsistency')}
          options={[
            { value: 'very-consistent', label: 'Very consistent throughout home' },
            { value: 'some-variations', label: 'Some noticeable variations' },
            { value: 'large-variations', label: 'Large variations between areas' }
          ]}
          required
        />

        <SelectField
          label="Number of Windows"
          value={data.windowCount}
          onChange={handleBasicChange('windowCount')}
          options={[
            { value: 'few', label: 'Few windows (less than 10)' },
            { value: 'average', label: 'Average amount (10-15)' },
            { value: 'many', label: 'Many windows (more than 15)' }
          ]}
          required
          isAutofilled={autofilledFields.includes('windowCount')}
        />

        <CheckboxGroup
          label="Air Leaks and Drafts"
          options={airLeakOptions}
          value={data.airLeaks}
          onChange={(value) => onInputChange('airLeaks', value)}
          helpText="Select all that apply"
          isAutofilled={autofilledFields.includes('airLeaks')}
        />
      </FormGrid>

      {/* Advanced Fields */}
      {showAdvanced && (
        <FormSectionAdvanced>
          {/* Insulation Assessment */}
          <FormSubsection title="Detailed Insulation Assessment">
            <FormGrid>
              {Object.entries(data.insulation).map(([area, value]) => (
                <SelectField
                  key={area}
                  label={`${area.charAt(0).toUpperCase() + area.slice(1)} Insulation`}
                  value={value}
                  onChange={handleInsulationChange(area as keyof typeof data.insulation)}
                  options={[
                    { value: 'good', label: 'Good - No noticeable issues' },
                    { value: 'average', label: 'Average - Some minor issues' },
                    { value: 'poor', label: 'Poor - Noticeable problems' },
                    { value: 'not-sure', label: 'Not Sure' },
                    { value: 'not-applicable', label: 'Not Applicable (N/A)' }
                  ]}
                />
              ))}
            </FormGrid>
          </FormSubsection>

          {/* Window Details */}
          <FormSubsection title="Window Details">
            <FormGrid>
              <SelectField
                label="Window Type"
                value={data.windowType}
                onChange={handleAdvancedChange('windowType')}
                options={[
                  { value: 'single', label: 'Single Pane' },
                  { value: 'double', label: 'Double Pane' },
                  { value: 'triple', label: 'Triple Pane' },
                  { value: 'not-sure', label: 'Not Sure' }
                ]}
              />

              <SelectField
                label="Window Condition"
                value={data.windowCondition}
                onChange={handleAdvancedChange('windowCondition')}
                options={[
                  { value: 'excellent', label: 'Excellent - Like new' },
                  { value: 'good', label: 'Good - Minor wear' },
                  { value: 'fair', label: 'Fair - Some issues' },
                  { value: 'poor', label: 'Poor - Major issues' }
                ]}
              />

              <SelectField
                label="Weather Stripping Type"
                value={data.weatherStripping}
                onChange={handleAdvancedChange('weatherStripping')}
                options={[
                  { value: 'not-sure', label: 'Not Sure' },
                  { value: 'door-sweep', label: 'Door Sweep' },
                  { value: 'foam', label: 'Foam' },
                  { value: 'metal', label: 'Metal' },
                  { value: 'none', label: 'None' }
                ]}
              />
            </FormGrid>
          </FormSubsection>

          {/* Humidity Data */}
          <FormSubsection title="Humidity Data">
            <FormGrid>
              <InputField
                label="Current Humidity (%)"
                type="number"
                value={data.currentHumidity || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value >= 0 && value <= 100) {
                    onInputChange('currentHumidity', value);
                  }
                }}
                min="0"
                max="100"
                placeholder="0-100"
                helpText="Current relative humidity percentage in your home"
              />
              
              <InputField
                label="Target Humidity (%)"
                type="number"
                value={data.targetHumidity || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value >= 0 && value <= 100) {
                    onInputChange('targetHumidity', value);
                  }
                }}
                min="0"
                max="100"
                placeholder="0-100"
                helpText="Desired relative humidity percentage (typically 30-50%)"
              />
              
              <InputField
                label="Indoor Temperature (°F)"
                type="number"
                value={data.humidityTemperature || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value >= 32 && value <= 100) {
                    onInputChange('humidityTemperature', value);
                  }
                }}
                min="32"
                max="100"
                placeholder="32-100"
                helpText="Indoor temperature for dew point calculations"
              />
            </FormGrid>
          </FormSubsection>
        </FormSectionAdvanced>
      )}
    </FormSection>
  );
};

export default CurrentConditionsForm;
