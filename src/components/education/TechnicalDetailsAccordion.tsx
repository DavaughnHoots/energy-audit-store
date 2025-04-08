import React, { useState } from 'react';
import { useComponentTracking } from '../../hooks/analytics/useComponentTracking';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
  const [isOpen, setIsOpen] = useState(false);
  const trackComponentEvent = useComponentTracking('education', 'TechnicalDetailsAccordion');
  
  const toggleAccordion = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    
    // Track accordion toggle events
    trackComponentEvent(newIsOpen ? 'technical_details_expanded' : 'technical_details_collapsed', {
      technique,
      section: 'insulation_page'
    });
  };
  
  return (
    <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={toggleAccordion}
        className="w-full flex justify-between items-center p-4 text-left font-medium bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500 transition-colors"
        aria-expanded={isOpen}
      >
        <span>{title}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </button>
      
      {isOpen && (
        <div className="p-4 bg-white border-t border-gray-200">
          {children}
        </div>
      )}
    </div>
  );
};

export default TechnicalDetailsAccordion;