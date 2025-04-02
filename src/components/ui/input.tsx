import React, { InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const Input: React.FC<InputProps> = ({ className = '', ...props }) => {
  return (
    <input 
      className={`block w-full rounded-md border border-gray-300 py-2 px-3 placeholder-gray-400 
                  shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 
                  text-sm ${className}`}
      {...props}
    />
  );
};
