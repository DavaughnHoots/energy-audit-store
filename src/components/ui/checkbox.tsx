import React, { forwardRef, InputHTMLAttributes } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'checked' | 'onChange'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  id?: string;
  className?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ checked, onCheckedChange, className = '', id, ...props }, ref) => {
    return (
      <div className="relative flex items-start">
        <div className="flex items-center h-5">
          <input
            id={id}
            ref={ref}
            type="checkbox"
            checked={checked}
            onChange={(e) => onCheckedChange?.(e.target.checked)}
            className={`h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 ${className}`}
            {...props}
          />
        </div>
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
