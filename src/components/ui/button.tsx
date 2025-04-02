import React, { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'link';
  size?: 'default' | 'sm' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'default',
  className = '',
  children,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500';
  
  const variantStyles = {
    default: 'bg-green-600 text-white hover:bg-green-700 shadow',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
    link: 'text-green-600 underline-offset-4 hover:underline'
  };
  
  const sizeStyles = {
    default: 'h-10 py-2 px-4 text-sm',
    sm: 'h-8 px-3 text-xs',
    lg: 'h-12 px-6 text-base'
  };
  
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${className}`;
  
  return (
    <button 
      className={combinedClassName}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
