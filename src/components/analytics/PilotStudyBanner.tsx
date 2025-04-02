import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * Banner that informs users about the ongoing pilot study
 * Includes dismiss functionality that remembers user preference using localStorage
 */
const PilotStudyBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    // Check if banner has been dismissed before
    const isBannerDismissed = localStorage.getItem('pilot_banner_dismissed') === 'true';
    
    if (isBannerDismissed) {
      setIsVisible(false);
    }
  }, []);
  
  const handleDismiss = () => {
    // Remember user's preference
    localStorage.setItem('pilot_banner_dismissed', 'true');
    setIsVisible(false);
  };
  
  // If banner has been dismissed, don't render anything
  if (!isVisible) {
    return null;
  }
  
  return (
    <div className="bg-blue-50 border-t border-b border-blue-100 text-blue-800 px-4 py-2">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 mr-2 text-blue-500" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
              clipRule="evenodd" 
            />
          </svg>
          <p className="text-sm">
            <span className="font-semibold">Pilot Study in Progress:</span> This site is currently part of a 2-week pilot study. 
            Anonymous usage data is being collected to improve our platform. 
            <Link to="/about-pilot-study" className="underline ml-1">Learn more</Link>
          </p>
        </div>
        <button 
          onClick={handleDismiss}
          className="ml-4 text-sm text-blue-500 hover:text-blue-700 font-medium"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default PilotStudyBanner;
