import React, { useState } from 'react';
import { useComponentTracking } from '../../hooks/analytics/useComponentTracking';

interface TechnicalDetailsAccordionProps {
  title: string;
  technique: string;
  children: React.ReactNode;
}

/**
 * An accordion component that displays technical details about insulation techniques
 */
const TechnicalDetailsAccordion: React.FC<TechnicalDetailsAccordionProps> = ({ 
  title,
  technique, 
  children 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const trackComponentEvent = useComponentTracking('education', 'TechnicalDetailsAccordion');

  const toggleAccordion = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    
    if (newState) {
      trackComponentEvent('technical_details_expanded', { technique });
    } else {
      trackComponentEvent('technical_details_collapsed', { technique });
    }
  };

  return (
    <div className="mt-6 border border-gray-200 rounded-md">
      <button
        className="w-full flex justify-between items-center p-4 focus:outline-none"
        onClick={toggleAccordion}
        aria-expanded={isOpen}
      >
        <span className="font-medium text-gray-800">{title}</span>
        <svg
          className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-gray-700 space-y-2">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default TechnicalDetailsAccordion;