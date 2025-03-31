import React, { useState, useEffect } from 'react';
import { Home } from 'lucide-react';
import { HomeDetailsFormProps } from './types';
import FormSection, { FormSectionAdvanced } from '../FormSection';
import { FormGrid, InputField, SelectField } from '../FormFields';
import { getDefaultValues, getSizeCategory } from './homeDefaults';
import { 
  getSingleFamilyDefaults,
  getTownhouseDefaults,
  getDuplexDefaults,
  getConstructionPeriod 
} from './housingTypeDefaults.ts';
import { getMobileHomeDefaults } from './MobileHomeDefaults';

const HomeDetailsForm: React.FC<HomeDetailsFormProps> = ({
  data,
  onInputChange,
  propertyType
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Set homeType based on propertyType from BasicInfoForm
  useEffect(() => {
    if (propertyType && !data.homeType) {
      onInputChange('homeType', propertyType);
    }
  }, [propertyType, data.homeType, onInputChange]);

  // Method to access parent data (yearBuilt in basicInfo)
  const getParentData = () => {
    // Try to access parent form data if available through DOM - this is a workaround
    // since we don't have direct access to the parent component's state
    const basicInfoSection = document.getElementById('basic-info-section');
    let yearBuilt = 2000; // Default to 2000 if we can't find the value
    
    if (basicInfoSection) {
      const yearBuiltInput = basicInfoSection.querySelector('input[name="yearBuilt"]');
      if (yearBuiltInput) {
        const inputValue = (yearBuiltInput as HTMLInputElement).value;
        if (inputValue && !isNaN(parseInt(inputValue))) {
          yearBuilt = parseInt(inputValue);
        }
      }
    }
    
    return { yearBuilt };
  };

  const handleBasicChange = (field: keyof typeof data) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = e.target.type === 'number' ? parseInt(e.target.value) : e.target.value;
    onInputChange(field, value);

    // Update advanced fields based on property type and size
    if (field === 'homeType' || field === 'homeSize') {
      const homeType = field === 'homeType' ? value as string : data.homeType;
      const homeSize = field === 'homeSize' ? value as number : data.homeSize;
      const sizeCategory = getSizeCategory(homeSize);
      
      // Automatically set squareFootage based on homeSize selection
      if (field === 'homeSize') {
        const sizeValue = parseInt(value as string);
        // Ensure we always set a positive value
        onInputChange('squareFootage', sizeValue > 0 ? sizeValue : 1500);
        console.log(`Setting squareFootage to ${sizeValue} based on homeSize selection`);
      }
      
      // Special handling for homes using research-based defaults
      if (homeType === 'mobile-home' || homeType === 'duplex') {
        try {
          const { yearBuilt } = getParentData();
          // Get home-type specific defaults based on year built, size, and (optionally) location
          const housingDefaults = homeType === 'mobile-home' 
            ? getMobileHomeDefaults(yearBuilt, homeSize)
            : getDuplexDefaults(yearBuilt, homeSize, undefined, data.unitPosition);
          
          // Apply housing type-specific defaults
          if (housingDefaults && housingDefaults.homeDetails) {
            // Update home details
            Object.entries(housingDefaults.homeDetails).forEach(([key, defaultValue]) => {
              if (key !== field && key in data) {
                onInputChange(key as keyof typeof data, defaultValue);
              }
            });
            
            // Here we'd also update currentConditions and heatingCooling in parent form,
            // but this requires parent form access which we'll implement later
            console.log(`Applied ${homeType} defaults based on year built:`, yearBuilt);
          }
        } catch (error) {
          console.error('Error applying mobile home defaults:', error);
          // Fallback to standard defaults if mobile-specific ones fail
          const defaults = getDefaultValues(homeType, sizeCategory);
          Object.entries(defaults).forEach(([key, defaultValue]) => {
            if (key !== field) {
              onInputChange(key as keyof typeof data, defaultValue);
            }
          });
        }
      } else {
        // Use standard defaults for non-mobile homes
        const defaults = getDefaultValues(homeType, sizeCategory);
        Object.entries(defaults).forEach(([key, defaultValue]) => {
          if (key !== field) {
            onInputChange(key as keyof typeof data, defaultValue);
          }
        });
      }
    }
  };

  const handleAdvancedChange = (field: keyof typeof data) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = e.target.type === 'number' ? parseInt(e.target.value) : e.target.value;
    onInputChange(field, value);
  };

  return (
    <FormSection
      title="Home Details"
      description="Tell us about your home's basic characteristics."
      icon={Home}
      showAdvanced={showAdvanced}
      onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
    >
      {/* Hidden field for homeType to ensure it's included in the form data */}
      <input 
        type="hidden" 
        name="homeType" 
        value={data.homeType || (propertyType || '')} 
      />
      
      {/* Basic Fields */}
      <FormGrid>

        <SelectField
          label="Size Category"
          value={data.homeSize.toString()}
          onChange={handleBasicChange('homeSize')}
          options={[
            { value: '1500', label: 'Small (under 1,500 sq ft)' },
            { value: '2500', label: 'Medium (1,500-2,500 sq ft)' },
            { value: '3500', label: 'Large (over 2,500 sq ft)' }
          ]}
          required
        />
        
        {data.homeType === 'townhouse' && (
          <SelectField
            label="Unit Position"
            value={data.unitPosition || 'interior'}
            onChange={handleBasicChange('unitPosition')}
            options={[
              { value: 'interior', label: 'Interior Unit (shared walls on both sides)' },
              { value: 'end', label: 'End Unit (shared wall on one side)' },
              { value: 'corner', label: 'Corner Unit (shared walls on two sides at corner)' }
            ]}
            helpText="This affects energy usage due to exposed exterior walls"
          />
        )}

        {data.homeType === 'duplex' && (
          <SelectField
            label="Unit Configuration"
            value={data.unitPosition || 'side-by-side'}
            onChange={handleBasicChange('unitPosition')}
            options={[
              { value: 'side-by-side', label: 'Side-by-Side Units' },
              { value: 'stacked', label: 'Stacked Units (one above the other)' },
              { value: 'front-to-back', label: 'Front-to-Back Units' }
            ]}
            helpText="This affects energy usage based on shared walls and floor/ceiling"
          />
        )}

        <SelectField
          label="Number of Stories"
          value={data.stories.toString()}
          onChange={handleBasicChange('stories')}
          options={[
            { value: '1', label: 'One' },
            { value: '2', label: 'Two' },
            { value: '3', label: 'Three' },
            { value: '4', label: 'Split-level' }
          ]}
          required
        />

        <SelectField
          label="Basement Type"
          value={data.basementType}
          onChange={handleBasicChange('basementType')}
          options={[
            { value: 'finished', label: 'Finished' },
            { value: 'unfinished', label: 'Unfinished' },
            { value: 'none', label: 'No Basement' }
          ]}
        />

        {data.basementType !== 'none' && (
          <SelectField
            label="Basement Heating"
            value={data.basementHeating}
            onChange={handleBasicChange('basementHeating')}
            options={[
              { value: 'heated', label: 'Heated' },
              { value: 'unheated', label: 'Unheated' }
            ]}
          />
        )}

        <InputField
          label="Square Footage"
          type="text"
          value={data.squareFootage || ''}
          onChange={(e) => {
            const inputValue = e.target.value;
            if (inputValue === '') {
              onInputChange('squareFootage', data.homeSize || 1500);
            } else if (/^\d+$/.test(inputValue)) {
              const value = parseInt(inputValue);
              onInputChange('squareFootage', value > 0 ? value : data.homeSize || 1500);
            }
          }}
          pattern="[0-9]*"
          inputMode="numeric"
          helpText="Enter the exact square footage of your home"
          required
        />
      </FormGrid>

      {/* Advanced Fields */}
      {showAdvanced && (
        <FormSectionAdvanced>
          <FormGrid>
            <InputField
              label="Exact Square Footage"
              type="text"
              value={data.squareFootage || ''}
              onChange={(e) => {
                const inputValue = e.target.value;
                if (inputValue === '') {
                  onInputChange('squareFootage', data.homeSize || 1500);
                } else if (/^\d+$/.test(inputValue)) {
                  const value = parseInt(inputValue);
                  onInputChange('squareFootage', value > 0 ? value : data.homeSize || 1500);
                }
              }}
              pattern="[0-9]*"
              inputMode="numeric"
              helpText="Enter the exact square footage of your home"
            />

            <InputField
              label="Number of Bedrooms"
              type="text"
              value={data.bedrooms || ''}
              onChange={(e) => {
                const inputValue = e.target.value;
                if (inputValue === '') {
                  onInputChange('bedrooms', '');
                } else if (/^\d+$/.test(inputValue)) {
                  const value = parseInt(inputValue);
                  onInputChange('bedrooms', value);
                }
              }}
              pattern="[0-9]*"
              inputMode="numeric"
            />

            <InputField
              label="Number of Bathrooms"
              type="text"
              value={data.bathrooms || ''}
              onChange={(e) => {
                const inputValue = e.target.value;
                if (inputValue === '') {
                  onInputChange('bathrooms', '');
                } else if (/^\d*\.?\d*$/.test(inputValue)) {
                  const value = parseFloat(inputValue);
                  if (!isNaN(value)) {
                    onInputChange('bathrooms', value);
                  }
                }
              }}
              pattern="[0-9]*\.?[0-9]*"
              inputMode="decimal"
            />

            <InputField
              label="Wall Length (ft)"
              type="text"
              value={data.wallLength || ''}
              onChange={(e) => {
                const inputValue = e.target.value;
                if (inputValue === '') {
                  onInputChange('wallLength', '');
                } else if (/^\d*\.?\d*$/.test(inputValue)) {
                  const value = parseFloat(inputValue);
                  if (!isNaN(value)) {
                    onInputChange('wallLength', value);
                  }
                }
              }}
              pattern="[0-9]*\.?[0-9]*"
              inputMode="decimal"
            />

            <InputField
              label="Wall Width (ft)"
              type="text"
              value={data.wallWidth || ''}
              onChange={(e) => {
                const inputValue = e.target.value;
                if (inputValue === '') {
                  onInputChange('wallWidth', '');
                } else if (/^\d*\.?\d*$/.test(inputValue)) {
                  const value = parseFloat(inputValue);
                  if (!isNaN(value)) {
                    onInputChange('wallWidth', value);
                  }
                }
              }}
              pattern="[0-9]*\.?[0-9]*"
              inputMode="decimal"
            />

            <InputField
              label="Ceiling Height (ft)"
              type="text"
              value={data.ceilingHeight || ''}
              onChange={(e) => {
                const inputValue = e.target.value;
                if (inputValue === '') {
                  onInputChange('ceilingHeight', '');
                } else if (/^\d*\.?\d*$/.test(inputValue)) {
                  const value = parseFloat(inputValue);
                  if (!isNaN(value)) {
                    onInputChange('ceilingHeight', value);
                  }
                }
              }}
              pattern="[0-9]*\.?[0-9]*"
              inputMode="decimal"
            />
          </FormGrid>
        </FormSectionAdvanced>
      )}
    </FormSection>
  );
};

export default HomeDetailsForm;
