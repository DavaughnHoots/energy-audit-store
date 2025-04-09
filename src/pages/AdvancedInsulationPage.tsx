import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InsulationInteractiveFeatures from '../components/education/InsulationInteractiveFeatures';
import { usePageTracking } from '../hooks/analytics/usePageTracking';

const AdvancedInsulationPage: React.FC = () => {
  // Track page view for analytics
  usePageTracking('education', {
    subSection: 'resources/advanced-insulation',
    resourceId: '2'
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced Insulation Techniques</h1>
          <p className="text-gray-600 mb-6">
            Discover cutting-edge insulation technologies that can dramatically improve your home's energy efficiency
          </p>
          
          {/* Interactive insulation content */}
          <InsulationInteractiveFeatures onStartAudit={handleStartAudit} />
        </div>
      </div>
    </div>
  );
};

export default AdvancedInsulationPage;
