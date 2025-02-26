import React from 'react';
import AutofillIndicator from './AutofillIndicator';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  className?: string;
  isAutofilled?: boolean;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  error,
  helpText,
  className = '',
  isAutofilled = false,
  children
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
        <AutofillIndicator isAutofilled={isAutofilled} />
      </label>
      {children}
      {helpText && (
        <p className="mt-1 text-sm text-gray-500">{helpText}</p>
      )}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

interface SelectFieldProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  label: string;
  options: { value: string; label: string }[];
  required?: boolean;
  error?: string;
  helpText?: string;
  className?: string;
  isAutofilled?: boolean;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  options,
  required,
  error,
  helpText,
  className = '',
  isAutofilled = false,
  ...props
}) => {
  return (
    <FormField
      label={label}
      required={required}
      error={error}
      helpText={helpText}
      className={className}
      isAutofilled={isAutofilled}
    >
      <select
        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 ${
          error ? 'border-red-300' : ''
        }`}
        {...props}
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
};

interface InputFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  className?: string;
  isAutofilled?: boolean;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  required,
  error,
  helpText,
  className = '',
  type = 'text',
  isAutofilled = false,
  ...props
}) => {
  return (
    <FormField
      label={label}
      required={required}
      error={error}
      helpText={helpText}
      className={className}
      isAutofilled={isAutofilled}
    >
      <input
        type={type}
        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 ${
          error ? 'border-red-300' : ''
        }`}
        {...props}
      />
    </FormField>
  );
};

interface CheckboxGroupProps {
  label: string;
  options: { id: string; label: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  required?: boolean;
  error?: string;
  helpText?: string;
  className?: string;
  isAutofilled?: boolean;
}

export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  label,
  options,
  value,
  onChange,
  required,
  error,
  helpText,
  className = '',
  isAutofilled = false
}) => {
  return (
    <FormField
      label={label}
      required={required}
      error={error}
      helpText={helpText}
      className={className}
      isAutofilled={isAutofilled}
    >
      <div className="mt-2 space-y-2">
        {options.map((option) => (
          <label key={option.id} className="flex items-center">
            <input
              type="checkbox"
              checked={value.includes(option.id)}
              onChange={(e) => {
                const newValue = e.target.checked
                  ? [...value, option.id]
                  : value.filter((v) => v !== option.id);
                onChange(newValue);
              }}
              className="rounded border-gray-300 text-green-600 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
            <span className="ml-2 text-sm text-gray-600">{option.label}</span>
          </label>
        ))}
      </div>
    </FormField>
  );
};

interface FormGridProps {
  columns?: 1 | 2 | 3;
  children: React.ReactNode;
  className?: string;
}

export const FormGrid: React.FC<FormGridProps> = ({
  columns = 2,
  children,
  className = ''
}) => {
  return (
    <div
      className={`grid grid-cols-1 gap-6 ${
        columns > 1 ? `md:grid-cols-${columns}` : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

interface FormSubsectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const FormSubsection: React.FC<FormSubsectionProps> = ({
  title,
  children,
  className = ''
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      {children}
    </div>
  );
};
