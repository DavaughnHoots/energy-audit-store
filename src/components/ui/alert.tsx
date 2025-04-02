import React from 'react';

export interface AlertProps {
  className?: string;
  children: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({ className = '', children }) => {
  return (
    <div className={`bg-green-50 border border-green-400 text-green-800 px-4 py-3 rounded relative ${className}`} role="alert">
      {children}
    </div>
  );
};

export interface AlertTitleProps {
  className?: string;
  children: React.ReactNode;
}

export const AlertTitle: React.FC<AlertTitleProps> = ({ className = '', children }) => {
  return (
    <h3 className={`font-medium ${className}`}>
      {children}
    </h3>
  );
};

export interface AlertDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

export const AlertDescription: React.FC<AlertDescriptionProps> = ({ className = '', children }) => {
  return (
    <div className={`mt-2 text-sm ${className}`}>
      {children}
    </div>
  );
};
