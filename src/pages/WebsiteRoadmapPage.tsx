import React from 'react';
import RoadmapFeature from '../components/admin/RoadmapFeature';
import { usePageTracking } from '../hooks/analytics/usePageTracking';

const WebsiteRoadmapPage: React.FC = () => {
  // Track page view for analytics
  usePageTracking('admin');

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Website Roadmap Tool</h1>
            <a 
              href="/admin/dashboard" 
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to Admin Dashboard
            </a>
          </div>
          
          <div className="border-t border-gray-200 pt-6">
            <RoadmapFeature />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebsiteRoadmapPage;
