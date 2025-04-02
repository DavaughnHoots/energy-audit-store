import React, { LabelHTMLAttributes } from 'react';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  className?: string;
  htmlFor?: string;
  children: React.ReactNode;
}

export const Label: React.FC<LabelProps> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <label
      className={`block text-sm font-medium text-gray-700 mb-1 ${className}`}
      {...props}
    >
      {children}
    </label>
  );
};
