import React from 'react';
import { AlertCircle } from 'lucide-react';

interface FormErrorDisplayProps {
  errors: string[];
}

const FormErrorDisplay: React.FC<FormErrorDisplayProps> = ({ errors }) => {
  if (errors.length === 0) return null;

  return (
    <div className="p-4 border-t border-red-100 bg-red-50">
      <div className="flex items-center mb-2">
        <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
        <div className="text-sm font-medium text-red-800">
          Please fix the following errors:
        </div>
      </div>
      <ul className="list-disc list-inside text-sm text-red-700 space-y-1 ml-7">
        {errors.map((error, index) => (
          <li key={index} className="leading-relaxed">
            {error}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FormErrorDisplay;
