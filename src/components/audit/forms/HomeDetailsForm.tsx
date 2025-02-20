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
              type="number"
              value={data.squareFootage || ''}
              onChange={handleAdvancedChange('squareFootage')}
              min={0}
              helpText="Enter the exact square footage of your home"
            />

            <InputField
              label="Number of Bedrooms"
              type="number"
              value={data.bedrooms || ''}
              onChange={handleAdvancedChange('bedrooms')}
              min={0}
            />

            <InputField
              label="Number of Bathrooms"
              type="number"
              value={data.bathrooms || ''}
              onChange={handleAdvancedChange('bathrooms')}
              min={0}
              step={0.5}
            />

            <InputField
              label="Wall Length (ft)"
              type="number"
              value={data.wallLength || ''}
              onChange={handleAdvancedChange('wallLength')}
              min={0}
            />

            <InputField
              label="Wall Width (ft)"
              type="number"
              value={data.wallWidth || ''}
              onChange={handleAdvancedChange('wallWidth')}
              min={0}
            />

            <InputField
              label="Ceiling Height (ft)"
              type="number"
              value={data.ceilingHeight || ''}
              onChange={handleAdvancedChange('ceilingHeight')}
              min={0}
            />
          </FormGrid>
        </FormSectionAdvanced>
      )}
    </FormSection>
  );
};

export default HomeDetailsForm;
