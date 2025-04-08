import React from 'react';
import { ChevronDown, ChevronUp, LucideIcon } from 'lucide-react';
import FormSectionTitle from './FormSectionTitle';

interface FormSectionProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  showAdvanced?: boolean;
  onToggleAdvanced?: () => void;
  children: React.ReactNode;
}

const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  icon,
  showAdvanced,
  onToggleAdvanced,
  children
}) => {
  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <FormSectionTitle
        title={title}
        description={description}
        icon={icon}
      />

      {/* Form Content */}
      <div className="space-y-6">
        {children}
      </div>

      {/* Advanced Toggle */}
      {onToggleAdvanced && (
        <div className="border-t mt-6 pt-4">
          <button
            type="button"
            onClick={onToggleAdvanced}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            {showAdvanced ? (
              <ChevronUp className="h-4 w-4 mr-2" />
            ) : (
              <ChevronDown className="h-4 w-4 mr-2" />
            )}
            {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
          </button>
        </div>
      )}
    </div>
  );
};

export const FormSectionAdvanced: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <div className="mt-6 space-y-6 bg-gray-50 p-4 rounded-lg">
      <div className="text-sm text-gray-500 mb-4">
        Advanced options help us provide more accurate recommendations.
        Default values are automatically set based on your basic selections, but you can modify them if needed.
      </div>
      {children}
    </div>
  );
};

export default FormSection;
