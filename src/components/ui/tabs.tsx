// src/components/ui/tabs.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type TabsContextValue = {
  value: string;
  onValueChange: (value: string) => void;
};

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

function useTabs() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
}

interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export const Tabs = ({ 
  defaultValue, 
  value, 
  onValueChange, 
  children,
  className 
}: TabsProps) => {
  const [tabValue, setTabValue] = useState(value || defaultValue);
  
  const handleValueChange = (newValue: string) => {
    if (onValueChange) {
      onValueChange(newValue);
    } else {
      setTabValue(newValue);
    }
  };

  return (
    <TabsContext.Provider
      value={{
        value: value !== undefined ? value : tabValue,
        onValueChange: handleValueChange,
      }}
    >
      <div className={cn('w-full', className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

interface TabsListProps {
  children: ReactNode;
  className?: string;
}

export const TabsList = ({ children, className }: TabsListProps) => {
  return (
    <div className={cn('flex space-x-1 rounded-lg border p-1 bg-gray-50', className)}>
      {children}
    </div>
  );
};

interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export const TabsTrigger = ({ value, children, className }: TabsTriggerProps) => {
  const { value: selectedValue, onValueChange } = useTabs();
  
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        selectedValue === value
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-500 hover:text-gray-900',
        className
      )}
      onClick={() => onValueChange(value)}
    >
      {children}
    </button>
  );
};

interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export const TabsContent = ({ value, children, className }: TabsContentProps) => {
  const { value: selectedValue } = useTabs();
  
  if (selectedValue !== value) return null;
  
  return (
    <div className={cn('mt-2', className)}>
      {children}
    </div>
  );
};
