import React, { useState } from 'react';
import { useComponentTracking } from '../../hooks/analytics/useComponentTracking';

interface TechnicalDetailsAccordionProps {
  title: string;
  technique: string;
  children: React.ReactNode;
}

const TechnicalDetailsAccordion: React.FC<TechnicalDetailsAccordionProps> = ({ 
  title, 
  technique, 
  children 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const trackComponentEvent = useComponentTracking('education', 'TechnicalDetailsAccordion');
  
  const toggleAccordion = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    
    // Track the event
    trackComponentEvent(
      newExpandedState ? 'accordion_expanded' : 'accordion_collapsed', 
      { 
        technique: technique,
        title: title
      }
    );
  };
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={toggleAccordion}
        className="w-full text-left p-4 flex justify-between items-center bg-gradient-to-r from-green-50 to-blue-50 hover:from-green-100 hover:to-blue-100 transition-colors"
        aria-expanded={isExpanded}
      >
        <span className="font-medium text-green-700">{title}</span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-5 w-5 text-green-600 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isExpanded && (
        <div className="p-4 bg-white">
          {children}
        </div>
      )}
    </div>
  );
};

export default TechnicalDetailsAccordion;