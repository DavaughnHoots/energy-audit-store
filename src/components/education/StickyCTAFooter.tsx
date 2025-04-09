import React, { useEffect, useState } from 'react';

interface StickyCTAFooterProps {
  onStartAudit: () => void;
  delayBeforeShow?: number; // in milliseconds
  scrollTriggerPoint?: number; // percentage of page height
}

const StickyCTAFooter: React.FC<StickyCTAFooterProps> = ({
  onStartAudit,
  delayBeforeShow = 3000, // Default 3 seconds
  scrollTriggerPoint = 30 // Default 30% scroll
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasTimePassed, setHasTimePassed] = useState(false);
  const [hasScrolledEnough, setHasScrolledEnough] = useState(false);

  useEffect(() => {
    // Time-based visibility
    const timer = setTimeout(() => {
      setHasTimePassed(true);
      updateVisibility();
    }, delayBeforeShow);

    // Scroll-based visibility
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const pageHeight = document.body.scrollHeight - window.innerHeight;
      const scrollPercentage = (scrollPosition / pageHeight) * 100;
      
      if (scrollPercentage >= scrollTriggerPoint) {
        setHasScrolledEnough(true);
        updateVisibility();
      }
    };

    const updateVisibility = () => {
      // Show the footer if either condition is met
      if (hasTimePassed || hasScrolledEnough) {
        setIsVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [delayBeforeShow, scrollTriggerPoint, hasTimePassed, hasScrolledEnough]);

  if (!isVisible) return null;

  return (
    <div className="sticky-cta-footer fixed bottom-0 left-0 right-0 bg-green-600 text-white py-3 px-4 shadow-md z-50 transition-all duration-300 transform translate-y-0">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex-1">
          <h4 className="text-lg font-bold">Ready to save on your energy bills?</h4>
          <p className="text-sm text-green-100">Get personalized insulation recommendations in just 60 seconds.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsVisible(false)}
            className="text-green-200 hover:text-white"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={onStartAudit}
            className="bg-white text-green-700 hover:bg-green-100 font-medium py-2 px-4 rounded-lg"
          >
            Start My Audit
          </button>
        </div>
      </div>
    </div>
  );
};

export default StickyCTAFooter;