import React, { useState, useEffect } from 'react';

interface StickyCTAFooterProps {
  onStartAudit: () => void;
}

const StickyCTAFooter: React.FC<StickyCTAFooterProps> = ({ onStartAudit }) => {
  const [visible, setVisible] = useState(false);
  
  // Show the footer after user has scrolled down a bit
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const showThreshold = window.innerHeight * 0.5; // Show after 50% of viewport height
      
      setVisible(scrollY > showThreshold);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-40 transition-transform duration-300 ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="hidden md:block">
          <p className="font-semibold text-gray-800">Ready to see which insulation works for your home?</p>
          <p className="text-sm text-gray-600">Get personalized recommendations in 60 seconds.</p>
        </div>
        <div className="w-full md:w-auto">
          <button
            onClick={onStartAudit}
            className="w-full md:w-auto py-3 px-6 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow transition-colors flex items-center justify-center"
          >
            Start My Energy Audit
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StickyCTAFooter;