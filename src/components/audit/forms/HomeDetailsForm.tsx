import React, { useState } from 'react';
import { Home } from 'lucide-react';
import { HomeDetailsFormProps } from './types';
import FormSection, { FormSectionAdvanced } from '../FormSection';
import { FormGrid, InputField, SelectField } from '../FormFields';
import { getDefaultValues, getSizeCategory } from './homeDefaults';

const HomeDetailsForm: React.FC<HomeDetailsFormProps> = ({
  data,
  onInputChange
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleBasicChange = (field: keyof typeof data) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = e.target.type === 'number' ? parseInt(e.target.value) : e.target.value;
    onInputChange(field, value);

    // Update advanced fields based on property type and size
    if (field === 'homeType' || field === 'homeSize') {
      const sizeCategory = getSizeCategory(data.homeSize);
      const defaults = getDefaultValues(data.homeType, sizeCategory);
      
      // Only update fields that haven't been manually modified
      Object.entries(defaults).forEach(([key, defaultValue]) => {
        if (key !== field) {
          onInputChange(key as keyof typeof data, defaultValue);
        }
      });
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
      {/* Basic Fields */}
      <FormGrid>
        <SelectField
          label="Property Type"
          value={data.homeType}
          onChange={handleBasicChange('homeType')}
          options={[
            { value: 'single-family', label: 'Single Family' },
            { value: 'townhouse', label: 'Townhouse' },
            { value: 'duplex', label: 'Duplex' },
            { value: 'apartment', label: 'Apartment' },
            { value: 'condominium', label: 'Condominium' },
            { value: 'mobile-home', label: 'Mobile Home' }
          ]}
          required
        />

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
                  onInputChange('squareFootage', '');
                } else {
                  const value = parseInt(inputValue);
                  if (!isNaN(value) && value >= 0) {
                    onInputChange('squareFootage', value);
                  }
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
                } else {
                  const value = parseInt(inputValue);
                  if (!isNaN(value) && value >= 0) {
                    onInputChange('bedrooms', value);
                  }
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
                } else {
                  const value = parseFloat(inputValue);
                  if (!isNaN(value) && value >= 0) {
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
                } else {
                  const value = parseFloat(inputValue);
                  if (!isNaN(value) && value >= 0) {
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
                } else {
                  const value = parseFloat(inputValue);
                  if (!isNaN(value) && value >= 0) {
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
                } else {
                  const value = parseFloat(inputValue);
                  if (!isNaN(value) && value >= 0) {
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
