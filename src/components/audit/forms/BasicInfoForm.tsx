import React from 'react';
import { User } from 'lucide-react';
import { BasicInfoFormProps } from './types';
import FormSection from '../FormSection';
import { FormGrid, InputField, SelectField } from '../FormFields';

const BasicInfoForm: React.FC<BasicInfoFormProps> = ({
  data,
  onInputChange
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
        />

        <InputField
          label="Email"
          type="email"
          value={data.email}
          onChange={handleChange('email')}
          required
        />

        <InputField
          label="Phone"
          type="tel"
          value={data.phone}
          onChange={handleChange('phone')}
          required
        />

        <InputField
          label="Address"
          value={data.address}
          onChange={handleChange('address')}
          required
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
        />

        <InputField
          label="Year Built"
          type="text"
          value={data.yearBuilt || ''}
          onChange={(e) => {
            const inputValue = e.target.value;
            if (inputValue === '') {
              onInputChange('yearBuilt', '');
            } else {
              const value = parseInt(inputValue);
              if (!isNaN(value) && value >= 1800 && value <= new Date().getFullYear()) {
                onInputChange('yearBuilt', value);
              }
            }
          }}
          pattern="[0-9]*"
          inputMode="numeric"
          required
          helpText="Enter the year your property was constructed"
        />

        <InputField
          label="Number of Occupants"
          type="text"
          value={data.occupants || ''}
          onChange={(e) => {
            const inputValue = e.target.value;
            if (inputValue === '') {
              onInputChange('occupants', '');
            } else {
              const value = parseInt(inputValue);
              if (!isNaN(value) && value >= 1 && value <= 20) {
                onInputChange('occupants', value);
              }
            }
          }}
          pattern="[0-9]*"
          inputMode="numeric"
          required
          helpText="How many people typically live in the property?"
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
