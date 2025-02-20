import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FormSectionTitleProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
}

const FormSectionTitle: React.FC<FormSectionTitleProps> = ({
  title,
  description,
  icon: Icon
}) => {
  return (
    <div className="mb-6">
      <div className="flex items-center">
        {Icon && (
          <div className="mr-3">
            <Icon className="h-6 w-6 text-gray-500" />
          </div>
        )}
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormSectionTitle;
