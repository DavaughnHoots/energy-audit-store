import React from 'react';

export interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ className = '', children }) => {
  return (
    <div className={`bg-white rounded-lg overflow-hidden ${className}`}>
      {children}
    </div>
  );
};

export interface CardHeaderProps {
  className?: string;
  children: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ className = '', children }) => {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
};

export interface CardTitleProps {
  className?: string;
  children: React.ReactNode;
}

export const CardTitle: React.FC<CardTitleProps> = ({ className = '', children }) => {
  return (
    <h3 className={`text-xl font-bold ${className}`}>
      {children}
    </h3>
  );
};

export interface CardDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

export const CardDescription: React.FC<CardDescriptionProps> = ({ className = '', children }) => {
  return (
    <p className={`text-sm text-gray-500 mt-1 ${className}`}>
      {children}
    </p>
  );
};

export interface CardContentProps {
  className?: string;
  children: React.ReactNode;
}

export const CardContent: React.FC<CardContentProps> = ({ className = '', children }) => {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
};

export interface CardFooterProps {
  className?: string;
  children: React.ReactNode;
}

export const CardFooter: React.FC<CardFooterProps> = ({ className = '', children }) => {
  return (
    <div className={`p-6 pt-0 ${className}`}>
      {children}
    </div>
  );
};
