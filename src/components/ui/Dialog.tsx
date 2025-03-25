// src/components/ui/dialog.tsx
import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({
  open = false,
  onOpenChange,
  children
}) => {
  if (!open) return null;

  const handleClose = () => {
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={handleClose} />
        {children}
      </div>
    </div>
  );
};

export interface DialogContentProps {
  className?: string;
  children: ReactNode;
}

export const DialogContent: React.FC<DialogContentProps> = ({ 
  className,
  children 
}) => {
  return (
    <div 
      className={cn(
        "relative w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all",
        className
      )}
    >
      {children}
    </div>
  );
};

export interface DialogHeaderProps {
  className?: string;
  children: ReactNode;
}

export const DialogHeader: React.FC<DialogHeaderProps> = ({ 
  className,
  children 
}) => {
  return (
    <div className={cn("mb-4", className)}>
      {children}
    </div>
  );
};

export interface DialogTitleProps {
  className?: string;
  children: ReactNode;
}

export const DialogTitle: React.FC<DialogTitleProps> = ({ 
  className,
  children 
}) => {
  return (
    <h3 className={cn("text-lg font-medium leading-6 text-gray-900", className)}>
      {children}
    </h3>
  );
};

export interface DialogDescriptionProps {
  className?: string;
  children: ReactNode;
}

export const DialogDescription: React.FC<DialogDescriptionProps> = ({ 
  className,
  children 
}) => {
  return (
    <div className={cn("mt-2", className)}>
      <p className="text-sm text-gray-500">{children}</p>
    </div>
  );
};
