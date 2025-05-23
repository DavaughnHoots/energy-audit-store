import React, { useState, ChangeEvent } from 'react';
import { EnergyConsumption } from '@/types/energyAudit';
import { Zap } from 'lucide-react';
import { EnergyUseFormProps } from './types';
import FormSection, { FormSectionAdvanced } from '../FormSection';
import { FormGrid, SelectField, InputField, FormSubsection } from '../FormFields';
import {
  occupancyPatternDefaults,
  seasonalVariationDefaults,
  monthlyBillRanges,
  peakTimeOptions,
  occupancyHourOptions
} from './energyDefaults';

const EnergyUseForm: React.FC<EnergyUseFormProps> = ({
  data,
  onInputChange
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [userModified, setUserModified] = useState<Record<string, boolean>>({});

  // Helper function to update a field if it hasn't been modified by the user
  const updateIfNotModified = (field: keyof EnergyConsumption, value: any): void => {
    if (!userModified[field]) {
      onInputChange(field, value);
    }
  };

  // Handle basic field changes and update related advanced fields
  const handleBasicFieldChange = (field: keyof EnergyConsumption, value: any): void => {
    onInputChange(field, value);

    // Update advanced fields based on occupancy pattern
    if (field === 'occupancyPattern') {
      const defaults = occupancyPatternDefaults[value as keyof typeof occupancyPatternDefaults];
      if (defaults) {
        updateIfNotModified('electricBill', defaults.electricBill);
        updateIfNotModified('gasBill', defaults.gasBill);
        updateIfNotModified('powerConsumption', defaults.powerConsumption);
        updateIfNotModified('occupancyHours', defaults.occupancyHours);
        updateIfNotModified('peakUsageTimes', defaults.peakUsageTimes);
        
        // Update occupancy factor from defaults
        updateIfNotModified('occupancyFactor', defaults.occupancyFactor);
        
        // Update daily usage hours from defaults
        updateIfNotModified('durationHours', defaults.durationHours);
      }
    }

    // Update advanced fields based on seasonal variation
    if (field === 'seasonalVariation') {
      const defaults = seasonalVariationDefaults[value as keyof typeof seasonalVariationDefaults];
      if (defaults) {
        updateIfNotModified('electricBill', 
          Math.round(data.electricBill * defaults.electricBillMultiplier)
        );
        updateIfNotModified('gasBill', 
          Math.round(data.gasBill * defaults.gasBillMultiplier)
        );
        updateIfNotModified('powerConsumption', 
          Math.round(data.powerConsumption * defaults.powerConsumptionMultiplier)
        );
        
        // Update seasonal factor from defaults
        updateIfNotModified('seasonalFactor', defaults.seasonalFactor);
      }
    }

    // Update advanced fields based on monthly bill range
    if (field === 'monthlyBill') {
      const range = monthlyBillRanges[value as keyof typeof monthlyBillRanges];
      if (range) {
        updateIfNotModified('electricBill', range.typical.electric);
        updateIfNotModified('gasBill', range.typical.gas);
      }
    }
  };

  // Handle advanced field changes
  const handleAdvancedFieldChange = (field: keyof EnergyConsumption, value: any): void => {
    setUserModified(prev => ({ ...prev, [field]: true }));
    onInputChange(field, value);
  };

  return (
    <FormSection
      title="Energy Usage"
      description="Tell us about your typical energy consumption patterns."
      icon={Zap}
      showAdvanced={showAdvanced}
      onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
    >
      {/* Basic Fields */}
      <FormGrid>
        <SelectField
          label="Renewable Energy Sources"
          value={data.renewableEnergy?.hasSolar ? 'yes' : 'no'}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => {
            const hasSolar = e.target.value === 'yes';
            onInputChange('renewableEnergy', {
              ...(data.renewableEnergy || {}),
              hasSolar
            });
          }}
          options={[
            { value: 'no', label: 'No Solar Panels' },
            { value: 'yes', label: 'Yes, I Have Solar Panels' }
          ]}
          helpText="Do you have solar panels installed at your property?"
        />

        {data.renewableEnergy?.hasSolar && (
          <>
            <InputField
              label="Number of Solar Panels"
              type="text"
              value={data.renewableEnergy?.solarPanelCount || ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const inputValue = e.target.value;
                if (inputValue === '') {
                  handleBasicFieldChange('renewableEnergy', {
                    ...(data.renewableEnergy || { hasSolar: true }),
                    solarPanelCount: ''
                  });
                } else if (/^\d+$/.test(inputValue)) {
                  const value = parseInt(inputValue);
                  handleBasicFieldChange('renewableEnergy', {
                    ...(data.renewableEnergy || { hasSolar: true }),
                    solarPanelCount: value
                  });
                }
              }}
              pattern="[0-9]*"
              inputMode="numeric"
            />
            
            <InputField
              label="System Age (years)"
              type="text"
              value={data.renewableEnergy?.solarAge || ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const inputValue = e.target.value;
                if (inputValue === '') {
                  handleBasicFieldChange('renewableEnergy', {
                    ...(data.renewableEnergy || { hasSolar: true }),
                    solarAge: ''
                  });
                } else if (/^\d+$/.test(inputValue)) {
                  const value = parseInt(inputValue);
                  handleBasicFieldChange('renewableEnergy', {
                    ...(data.renewableEnergy || { hasSolar: true }),
                    solarAge: value
                  });
                }
              }}
              pattern="[0-9]*"
              inputMode="numeric"
            />
          </>
        )}
        <SelectField
          label="Basic Occupancy Pattern"
          value={data.occupancyPattern}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => handleBasicFieldChange('occupancyPattern', e.target.value)}
          options={[
            { value: 'home-all-day', label: 'Home All Day' },
            { value: 'work-hours', label: 'Away During Work Hours' },
            { value: 'evenings-weekends', label: 'Evenings and Weekends Only' },
            { value: 'variable', label: 'Variable Schedule' }
          ]}
          required
        />

        <SelectField
          label="Seasonal Energy Usage Pattern"
          value={data.seasonalVariation}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => handleBasicFieldChange('seasonalVariation', e.target.value)}
          options={[
            { value: 'highest-summer', label: 'Highest in Summer' },
            { value: 'highest-winter', label: 'Highest in Winter' },
            { value: 'consistent', label: 'Fairly Consistent' }
          ]}
          required
        />

        <SelectField
          label="Monthly Energy Bill Range"
          value={data.monthlyBill.toString()}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => handleBasicFieldChange('monthlyBill', e.target.value)}
          options={[
            { value: 'low', label: 'Low ($0-$100)' },
            { value: 'medium', label: 'Medium ($101-$250)' },
            { value: 'high', label: 'High (over $250)' }
          ]}
          required
        />
        
        <InputField
          label="Daily Usage Hours"
          type="number"
          value={data.durationHours || ''}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const value = parseInt(e.target.value);
            if (!isNaN(value) && value >= 0 && value <= 24) {
              handleBasicFieldChange('durationHours', value);
            }
          }}
          min="0"
          max="24"
          placeholder="Hours per day (0-24)"
          helpText="Average number of hours your equipment is used daily"
        />
      </FormGrid>

      {/* Advanced Fields */}
      {showAdvanced && (
        <FormSectionAdvanced>
          {/* Renewable Energy Details */}
          {data.renewableEnergy?.hasSolar && (
            <FormSubsection title="Renewable Energy Details">
              <FormGrid>
                <InputField
                  label="System Capacity (kW)"
                  type="text"
                  value={data.renewableEnergy?.solarCapacity || ''}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const inputValue = e.target.value;
                    if (inputValue === '') {
                      handleAdvancedFieldChange('renewableEnergy', {
                        ...(data.renewableEnergy || { hasSolar: true }),
                        solarCapacity: ''
                      });
                    } else if (/^\d*\.?\d*$/.test(inputValue)) {
                      const value = parseFloat(inputValue);
                      handleAdvancedFieldChange('renewableEnergy', {
                        ...(data.renewableEnergy || { hasSolar: true }),
                        solarCapacity: value
                      });
                    }
                  }}
                  pattern="[0-9]*\.?[0-9]*"
                  inputMode="decimal"
                  helpText="Total system capacity in kilowatts"
                />
                
                <InputField
                  label="Monthly Generation (kWh)"
                  type="text"
                  value={data.renewableEnergy?.solarGeneration || ''}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const inputValue = e.target.value;
                    if (inputValue === '') {
                      handleAdvancedFieldChange('renewableEnergy', {
                        ...(data.renewableEnergy || { hasSolar: true }),
                        solarGeneration: ''
                      });
                    } else if (/^\d+$/.test(inputValue)) {
                      const value = parseInt(inputValue);
                      handleAdvancedFieldChange('renewableEnergy', {
                        ...(data.renewableEnergy || { hasSolar: true }),
                        solarGeneration: value
                      });
                    }
                  }}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  helpText="Average monthly electricity generation"
                />
              </FormGrid>
            </FormSubsection>
          )}
          {/* Power Factor */}
          <FormSubsection title="Advanced Energy Parameters">
            <FormGrid>
              <InputField
                label="Power Factor (0.8-1.0)"
                type="number"
                value={data.powerFactor || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value) && value >= 0.8 && value <= 1.0) {
                    handleAdvancedFieldChange('powerFactor', value);
                  }
                }}
                step="0.01"
                min="0.8"
                max="1.0"
                placeholder="0.8-1.0"
                helpText="Power factor affects real power consumption (0.9 is typical for residential)"
              />
            </FormGrid>
          </FormSubsection>
          
          {/* Energy Bills */}
          <FormSubsection title="Detailed Energy Bills">
            <div className="mb-4">
              <p className="text-sm text-gray-600 italic">
                If your utilities are included in rent and you don't have access to this information, select "Not Available".
              </p>
            </div>
            <FormGrid>
              <div className="flex flex-col space-y-2">
                <label className="block text-sm font-medium text-gray-700">Monthly Electric Usage (kWh)</label>
                <div className="flex items-center">
                  <InputField
                    label=""
                    hideLabel={true}
                    type="text"
                    value={data.electricBill === -1 ? '' : data.electricBill || ''}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      const inputValue = e.target.value;
                      if (inputValue === '') {
                        handleAdvancedFieldChange('electricBill', '');
                      } else if (/^\d*\.?\d*$/.test(inputValue)) {
                        const value = parseFloat(inputValue);
                        if (!isNaN(value)) {
                          handleAdvancedFieldChange('electricBill', value);
                        }
                      }
                    }}
                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                      const value = parseFloat(e.target.value);
                      if (isNaN(value) || value < 0) {
                        // Could add visual feedback here if needed
                      }
                    }}
                    pattern="[0-9]*\.?[0-9]*"
                    inputMode="decimal"
                    disabled={data.electricBill === -1}
                    className={data.electricBill === -1 ? "opacity-50" : ""}
                  />
                  <div className="ml-4">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        className="rounded text-green-600"
                        checked={data.electricBill === -1}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleAdvancedFieldChange('electricBill', -1);
                          } else {
                            handleAdvancedFieldChange('electricBill', '');
                          }
                        }}
                      />
                      <span className="ml-2 text-sm text-gray-700">Not Available</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                <label className="block text-sm font-medium text-gray-700">Monthly Gas Usage (therms)</label>
                <div className="flex items-center">
                  <InputField
                    label=""
                    hideLabel={true}
                    type="text"
                    value={data.gasBill === -1 ? '' : data.gasBill || ''}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      const inputValue = e.target.value;
                      if (inputValue === '') {
                        handleAdvancedFieldChange('gasBill', '');
                      } else if (/^\d*\.?\d*$/.test(inputValue)) {
                        const value = parseFloat(inputValue);
                        if (!isNaN(value)) {
                          handleAdvancedFieldChange('gasBill', value);
                        }
                      }
                    }}
                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                      const value = parseFloat(e.target.value);
                      if (isNaN(value) || value < 0) {
                        // Could add visual feedback here if needed
                      }
                    }}
                    pattern="[0-9]*\.?[0-9]*"
                    inputMode="decimal"
                    disabled={data.gasBill === -1}
                    className={data.gasBill === -1 ? "opacity-50" : ""}
                  />
                  <div className="ml-4">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        className="rounded text-green-600"
                        checked={data.gasBill === -1}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleAdvancedFieldChange('gasBill', -1);
                          } else {
                            handleAdvancedFieldChange('gasBill', '');
                          }
                        }}
                      />
                      <span className="ml-2 text-sm text-gray-700">Not Available</span>
                    </label>
                  </div>
                </div>
              </div>

              <InputField
                label="Average Daily Power Consumption (kWh)"
                type="text"
                value={data.powerConsumption || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const inputValue = e.target.value;
                  if (inputValue === '') {
                    handleAdvancedFieldChange('powerConsumption', '');
                  } else if (/^\d*\.?\d*$/.test(inputValue)) {
                    const value = parseFloat(inputValue);
                    if (!isNaN(value)) {
                      handleAdvancedFieldChange('powerConsumption', value);
                    }
                  }
                }}
                onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                  const value = parseFloat(e.target.value);
                  if (isNaN(value) || value < 0) {
                    // Could add visual feedback here if needed
                  }
                }}
                pattern="[0-9]*\.?[0-9]*"
                inputMode="decimal"
              />
            </FormGrid>
          </FormSubsection>

          {/* Occupancy Hours */}
          <FormSubsection title="Detailed Occupancy Hours">
            <div className="mb-4">
              <p className="text-sm text-gray-600 italic">
                This indicates how many hours you typically spend at your property during weekdays and weekends.
              </p>
            </div>
            <FormGrid>
              <SelectField
                label="Weekday Hours at Home"
                value={data.occupancyHours.weekday}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => handleAdvancedFieldChange('occupancyHours', {
                  ...data.occupancyHours,
                  weekday: e.target.value
                })}
                options={occupancyHourOptions.map(option => ({
                  value: option.value,
                  label: option.label
                }))}
              />

              <SelectField
                label="Weekend Hours at Home"
                value={data.occupancyHours.weekend}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => handleAdvancedFieldChange('occupancyHours', {
                  ...data.occupancyHours,
                  weekend: e.target.value
                })}
                options={occupancyHourOptions.map(option => ({
                  value: option.value,
                  label: option.label
                }))}
              />
            </FormGrid>
          </FormSubsection>
        </FormSectionAdvanced>
      )}
    </FormSection>
  );
};

export default EnergyUseForm;
