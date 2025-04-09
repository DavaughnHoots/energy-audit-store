import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SolarInteractiveFeatures from '../components/education/solar/SolarInteractiveFeatures';
import { usePageTracking } from '../hooks/analytics/usePageTracking';

const ResidentialSolarPage: React.FC = () => {
  // Track page view for analytics
  usePageTracking('education', {
    subSection: 'resources/residential-solar',
    resourceId: '3' // Assuming this is the ID for the residential solar resource
  });
  
  const navigate = useNavigate();
  
  // Handler for starting an energy audit
  const handleStartAudit = () => {
    navigate('/energy-audit');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Residential Solar Options</h1>
          <p className="text-gray-600 mb-6">
            Explore modern solar technologies to harness clean energy and reduce your utility bills
          </p>
          
          {/* Interactive solar content */}
          <SolarInteractiveFeatures onStartAudit={handleStartAudit} />
        </div>
      </div>
    </div>
  );
};

export default ResidentialSolarPage;
