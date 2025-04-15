import React, { useState, useRef, useEffect } from 'react';
import { usePageTracking } from '@/hooks/analytics/usePageTracking';

const PilotSurvey: React.FC = () => {
  usePageTracking('dashboard', { section: 'survey' });
  
  // Ref to track if the form has loaded
  const formLoadedRef = useRef<boolean>(false);
  
  // Track when the iframe loads
  const handleIframeLoad = () => {
    if (!formLoadedRef.current) {
      // Track the form load event
      // We would add actual tracking code here if available
      console.log('Google Form loaded');
      formLoadedRef.current = true;
    }
  };
  
  // Set form height based on window size
  useEffect(() => {
    const handleResize = () => {
      const iframe = document.getElementById('survey-iframe') as HTMLIFrameElement;
      if (iframe) {
        // Set iframe height based on window size, with minimum height
        const height = Math.max(window.innerHeight * 0.7, 500);
        iframe.style.height = `${height}px`;
      }
    };
    
    // Set initial height
    handleResize();
    
    // Update on resize
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Pilot Study Feedback</h3>
        <p className="text-blue-700 mb-4">
          Thank you for participating in our pilot study! Your feedback will help us improve the platform.
          This survey should take approximately 5 minutes to complete.
        </p>
        
        {/* Why Participate section - mirroring content from FAQ */}
        <h4 className="text-md font-medium text-blue-800 mb-2">Why Your Feedback Matters:</h4>
        <ul className="list-disc pl-5 mb-4 text-blue-700 space-y-1">
          <li><strong>Direct Impact:</strong> Your insights will guide our improvements.</li>
          <li><strong>Early Access:</strong> You're among the first to use our innovative tools.</li>
          <li><strong>Quick & Easy:</strong> The survey takes only about 5 minutes to complete.</li>
        </ul>
        
        <p className="text-blue-700">
          <a href="/pilot-study-faq" className="text-blue-600 hover:underline font-medium">
            View complete Pilot Study FAQ →
          </a>
        </p>
      </div>
      
      {/* Google Form Embed */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <iframe 
          id="survey-iframe"
          src="https://docs.google.com/forms/d/e/1FAIpQLSfXlIe-BQDZtruARwwLz38_cF2TedQiU_cN1sM_gejRGsAfOg/viewform?embedded=true" 
          width="100%" 
          height="700px" 
          frameBorder="0" 
          marginHeight={0} 
          marginWidth={0}
          onLoad={handleIframeLoad}
          title="Pilot Study Feedback Form"
          className="w-full"
        >
          Loading survey...
        </iframe>
      </div>
    </div>
  );
};

export default PilotSurvey;
