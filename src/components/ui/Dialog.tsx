import React, { ReactNode } from 'react';

// Simple Dialog component
interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
}

const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
        <div className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
          <h3 className="text-lg font-medium leading-6 text-gray-900">{title}</h3>
          
          {description && (
            <div className="mt-2">
              <p className="text-sm text-gray-500">{description}</p>
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  );
};

// Export components for RecommendationCard.tsx
export { Dialog };
export const DialogContent: React.FC<{ children: ReactNode }> = ({ children }) => <div>{children}</div>;
export const DialogHeader: React.FC<{ children: ReactNode }> = ({ children }) => <div>{children}</div>;
export const DialogTitle: React.FC<{ children: ReactNode }> = ({ children }) => <h3 className="text-lg font-medium leading-6 text-gray-900">{children}</h3>;

export default Dialog;
