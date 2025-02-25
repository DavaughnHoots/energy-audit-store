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
          type="number"
          value={data.yearBuilt || ''}
          onChange={handleChange('yearBuilt')}
          min={1800}
          max={new Date().getFullYear()}
          required
          helpText="Enter the year your property was constructed"
        />

        <InputField
          label="Number of Occupants"
          type="number"
          value={data.occupants || ''}
          onChange={handleChange('occupants')}
          min={1}
          max={20}
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
