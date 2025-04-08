import React, { ReactNode } from 'react';

// Export the Dialog component as both named and default export
interface DialogProps {
  open?: boolean;
  isOpen?: boolean; // for backward compatibility
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void; // for backward compatibility
  children: ReactNode;
}

export function Dialog({ open, isOpen, onOpenChange, onClose, children }: DialogProps) {
  // Support both open/onOpenChange and isOpen/onClose patterns
  const isDialogOpen = open !== undefined ? open : (isOpen || false);
  
  const handleClose = () => {
    if (onOpenChange) onOpenChange(false);
    if (onClose) onClose();
  };
  
  if (!isDialogOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg shadow-lg w-full max-h-[90vh] overflow-hidden"
      >
        {children}
      </div>
    </div>
  );
}

export function DialogTrigger({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <div onClick={onClick} className="cursor-pointer">
      {children}
    </div>
  );
}

export function DialogContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`p-4 overflow-y-auto max-h-[calc(90vh-8rem)] ${className}`}>{children}</div>;
}

export function DialogHeader({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-between p-4 border-b mb-4">{children}</div>;
}

export function DialogTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>{children}</h3>;
}

export function DialogDescription({ children }: { children: ReactNode }) {
  return <p className="text-sm text-gray-500 mt-1">{children}</p>;
}

export function DialogFooter({ children }: { children: ReactNode }) {
  return <div className="flex justify-end space-x-2 mt-4">{children}</div>;
}

// Export as default for import statements like: import Dialog from '@/components/ui/Dialog'
export default Dialog;
