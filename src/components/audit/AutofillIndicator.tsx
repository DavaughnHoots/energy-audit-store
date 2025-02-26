import React from 'react';

interface AutofillIndicatorProps {
  isAutofilled: boolean;
}

const AutofillIndicator: React.FC<AutofillIndicatorProps> = ({ isAutofilled }) => {
  if (!isAutofilled) return null;
  
  return (
    <div className="inline-flex items-center justify-center w-5 h-5 ml-2 bg-blue-100 text-blue-600 rounded-full" 
         title="This field was auto-filled from your profile">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    </div>
  );
};

export default AutofillIndicator;
