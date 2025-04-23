import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EnergyEfficiencyInteractiveFeatures from '../components/education/energy-efficiency/EnergyEfficiencyInteractiveFeatures';
import { usePageTracking } from '../hooks/analytics/usePageTracking';

const HomeEnergyEfficiencyPage: React.FC = () => {
  // Track page view for analytics
  usePageTracking('education', {
    subSection: 'resources/home-energy-efficiency',
    resourceId: '4' // Assuming this is the ID for the home energy efficiency resource
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Home Energy Efficiency Fundamentals</h1>
          <p className="text-gray-600 mb-6">
            Discover how to optimize your home's energy usage to save money and reduce your environmental footprint
          </p>
          
          {/* Interactive energy efficiency content */}
          <EnergyEfficiencyInteractiveFeatures onStartAudit={handleStartAudit} />
        </div>
      </div>
    </div>
  );
};

export default HomeEnergyEfficiencyPage;
