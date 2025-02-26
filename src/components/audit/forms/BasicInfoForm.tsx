import React from 'react';
import { User } from 'lucide-react';
import { BasicInfoFormProps } from './types';
import FormSection from '../FormSection';
import { FormGrid, InputField, SelectField } from '../FormFields';

const BasicInfoForm: React.FC<BasicInfoFormProps> = ({
  data,
  onInputChange,
  autofilledFields = []
}) => {
  const handleChange = (field: keyof typeof data) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = e.target.type === 'number' ? parseInt(e.target.value) : e.target.value;
    onInputChange(field, value);
  };

  return (
    <FormSection
      title="Basic Information"
      description="Please provide your contact information and basic property details."
      icon={User}
    >
      <FormGrid>
        <InputField
          label="Full Name"
          value={data.fullName}
          onChange={handleChange('fullName')}
          required
          isAutofilled={autofilledFields.includes('fullName')}
        />

        <InputField
          label="Email"
          type="email"
          value={data.email}
          onChange={handleChange('email')}
          required
          isAutofilled={autofilledFields.includes('email')}
        />

        <InputField
          label="Phone"
          type="tel"
          value={data.phone}
          onChange={handleChange('phone')}
          required
          isAutofilled={autofilledFields.includes('phone')}
        />

        <InputField
          label="Address"
          value={data.address}
          onChange={handleChange('address')}
          required
          isAutofilled={autofilledFields.includes('address')}
        />

        <SelectField
          label="Property Type"
          value={data.propertyType}
          onChange={handleChange('propertyType')}
          options={[
            { value: 'single-family', label: 'Single Family Home' },
            { value: 'townhouse', label: 'Townhouse' },
            { value: 'duplex', label: 'Duplex' },
            { value: 'apartment', label: 'Apartment' },
            { value: 'condominium', label: 'Condominium' },
            { value: 'mobile-home', label: 'Mobile Home' }
          ]}
          required
          isAutofilled={autofilledFields.includes('propertyType')}
        />

        <InputField
          label="Year Built"
          type="text"
          value={data.yearBuilt || ''}
          onChange={(e) => {
            const inputValue = e.target.value;
            // Always update the input field to allow typing
            if (inputValue === '') {
              onInputChange('yearBuilt', '');
            } else if (/^\d+$/.test(inputValue)) {
              // Only parse and validate if it's a complete number
              const value = parseInt(inputValue);
              // Store the raw value, validation will happen on form submission
              onInputChange('yearBuilt', value);
            }
          }}
          onBlur={(e) => {
            // Validate on blur for better user experience
            const value = parseInt(e.target.value);
            if (isNaN(value) || value < 1800 || value > new Date().getFullYear()) {
              // Could add visual feedback here if needed
            }
          }}
          pattern="[0-9]*"
          inputMode="numeric"
          required
          helpText="Enter the year your property was constructed (1800-present)"
        />

        <InputField
          label="Number of Occupants"
          type="text"
          value={data.occupants || ''}
          onChange={(e) => {
            const inputValue = e.target.value;
            // Always update the input field to allow typing
            if (inputValue === '') {
              onInputChange('occupants', '');
            } else if (/^\d+$/.test(inputValue)) {
              // Only parse and validate if it's a complete number
              const value = parseInt(inputValue);
              // Store the raw value, validation will happen on form submission
              onInputChange('occupants', value);
            }
          }}
          onBlur={(e) => {
            // Validate on blur for better user experience
            const value = parseInt(e.target.value);
            if (isNaN(value) || value < 1 || value > 20) {
              // Could add visual feedback here if needed
            }
          }}
          pattern="[0-9]*"
          inputMode="numeric"
          required
          helpText="How many people typically live in the property? (1-20)"
        />

        <InputField
          label="Audit Date"
          type="date"
          value={data.auditDate}
          onChange={handleChange('auditDate')}
          required
        />
      </FormGrid>
    </FormSection>
  );
};

export default BasicInfoForm;
