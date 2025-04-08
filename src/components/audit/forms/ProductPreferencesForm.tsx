import React, { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { ProductPreferencesFormProps } from './types';
import FormSection, { FormSectionAdvanced } from '../FormSection';
import { FormGrid, SelectField, InputField, FormSubsection, CheckboxGroup } from '../FormFields';

// Product category options
const productCategoryOptions = [
  { id: 'hvac', label: 'HVAC Systems' },
  { id: 'lighting', label: 'Lighting' },
  { id: 'insulation', label: 'Insulation' },
  { id: 'windows', label: 'Windows & Doors' },
  { id: 'appliances', label: 'Energy-Efficient Appliances' },
  { id: 'water_heating', label: 'Water Heating' },
  { id: 'smart_home', label: 'Smart Home Devices' },
  { id: 'renewable', label: 'Renewable Energy' }
];

// Product feature options
const productFeatureOptions = [
  { id: 'energy_star', label: 'Energy Star Certified' },
  { id: 'smart_controls', label: 'Smart Controls/Connectivity' },
  { id: 'high_efficiency', label: 'High Efficiency Rating' },
  { id: 'eco_friendly', label: 'Eco-Friendly Materials' },
  { id: 'low_maintenance', label: 'Low Maintenance' },
  { id: 'quiet_operation', label: 'Quiet Operation' },
  { id: 'warranty', label: 'Extended Warranty' },
  { id: 'rebate_eligible', label: 'Rebate Eligible' }
];

// Budget range options
const budgetRangeOptions = [
  { value: '1000', label: 'Under $1,000' },
  { value: '5000', label: 'Up to $5,000' },
  { value: '10000', label: 'Up to $10,000' },
  { value: '25000', label: 'Up to $25,000' },
  { value: '50000', label: 'Up to $50,000' },
  { value: '100000', label: 'Over $50,000' }
];

const ProductPreferencesForm: React.FC<ProductPreferencesFormProps> = ({
  data,
  onInputChange,
  autofilledFields = []
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Initialize data if empty
  if (!data.categories) {
    onInputChange('categories', []);
  }
  
  if (!data.features) {
    onInputChange('features', []);
  }
  
  if (!data.budgetConstraint) {
    onInputChange('budgetConstraint', 5000); // Default budget
  }

  return (
    <FormSection
      title="Product Preferences"
      description="Tell us about your preferences for energy-efficient products and improvements."
      icon={ShoppingBag}
      showAdvanced={showAdvanced}
      onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
    >
      {/* Basic Fields */}
      <FormGrid>
        <CheckboxGroup
          label="Product Categories of Interest"
          options={productCategoryOptions}
          value={data.categories}
          onChange={(value) => onInputChange('categories', value)}
          helpText="Select all that apply"
        />
        
        <SelectField
          label="Budget Range"
          value={data.budgetConstraint.toString()}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
            onInputChange('budgetConstraint', parseInt(e.target.value))}
          options={budgetRangeOptions}
          required
        />
      </FormGrid>

      {/* Advanced Fields */}
      {showAdvanced && (
        <FormSectionAdvanced>
          <FormSubsection title="Detailed Preferences">
            <FormGrid>
              <CheckboxGroup
                label="Desired Product Features"
                options={productFeatureOptions}
                value={data.features}
                onChange={(value) => onInputChange('features', value)}
                helpText="Select all that apply"
              />
              
              <InputField
                label="Exact Budget Amount ($)"
                type="number"
                value={data.budgetConstraint || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value >= 0) {
                    onInputChange('budgetConstraint', value);
                  }
                }}
                min="0"
                step="100"
                placeholder="Enter exact budget amount"
                helpText="Your maximum budget for energy-efficient improvements"
              />
            </FormGrid>
          </FormSubsection>
        </FormSectionAdvanced>
      )}
    </FormSection>
  );
};

export default ProductPreferencesForm;
