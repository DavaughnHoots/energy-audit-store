import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SeasonalEnergyTipsInteractiveFeatures from '@/components/education/seasonal/SeasonalEnergyTipsInteractiveFeatures';

// Mock components that would normally be imported from shared components
const Page: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <div className="min-h-screen bg-gray-50">{children}</div>
);

const Container: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
  <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className || ''}`}>{children}</div>
);

// Mock hooks
const usePageTracking = () => (event: string, data?: any) => {
  console.log(`Page tracking: ${event}`, data);
};

const SeasonalEnergyTipsPage: React.FC = () => {
  const navigate = useNavigate();
  const trackPage = usePageTracking();
  const [printMode, setPrintMode] = useState(false);

  const handleStartAudit = () => {
    trackPage('navigate_to_audit', { from: 'seasonal_energy_tips' });
    navigate('/audit');
  };

  const handleBackToResources = () => {
    trackPage('navigate_to_resources', { from: 'seasonal_energy_tips' });
    navigate('/education');
  };

  return (
    <Page>
      <Container className="pt-6 pb-12">
        <div className="flex flex-col">
          {/* Header Section */}
          <div className="mb-6">
            <button
              className="px-4 py-2 text-sm text-green-700 hover:text-green-800 hover:bg-green-50 rounded-md mb-4"
              onClick={handleBackToResources}
            >
              ← Back to Resources
            </button>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Seasonal Energy Saving Tips
            </h1>

            <div className="flex items-center text-sm text-gray-500 mb-4">
              <span className="mr-4">Updated: April 23, 2025</span>
              <span className="mr-4">•</span>
              <span>10 min read</span>
            </div>

            <p className="text-gray-600 text-lg mb-4">
              Smart energy moves for every season to keep your home comfortable and efficient year-round. Learn how to optimize your energy usage throughout the year with seasonally appropriate tips, tools, and strategies.
            </p>
          </div>

          {/* Main Content with Interactive Features */}
          <div className={printMode ? 'print-friendly' : ''}>
            <SeasonalEnergyTipsInteractiveFeatures onStartAudit={handleStartAudit} />
          </div>

          {/* Related Content */}
          <div className="mt-12 pt-6 border-t">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Resources</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div 
                className="p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate('/education/resources/home-energy-efficiency')}
              >
                <h4 className="font-medium mb-2">Home Energy Efficiency Fundamentals</h4>
                <p className="text-sm text-gray-600">Comprehensive guide to understanding home energy efficiency</p>
              </div>
              
              <div 
                className="p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate('/education/resources/home-insulation-basics')}
              >
                <h4 className="font-medium mb-2">Home Insulation Basics</h4>
                <p className="text-sm text-gray-600">Learn the fundamentals of home insulation</p>
              </div>
              
              <div 
                className="p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate('/education/resources/advanced-insulation')}
              >
                <h4 className="font-medium mb-2">Advanced Insulation Techniques</h4>
                <p className="text-sm text-gray-600">Learn about cutting-edge insulation methods</p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Page>
  );
};

export default SeasonalEnergyTipsPage;