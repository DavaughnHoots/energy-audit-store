import React from 'react';

/**
 * Reports tab for the dashboard
 * Currently a placeholder for future functionality
 */
const ReportsTab: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Reports</h2>
      <p className="text-gray-500">Report functionality will be available soon.</p>
      
      {/* Placeholder card with subtle styling */}
      <div className="mt-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
        <h3 className="text-md font-medium text-gray-700 mb-2">Energy Audit Reports</h3>
        <p className="text-sm text-gray-500 mb-4">
          View and download detailed reports of your energy audits and track improvements over time.
        </p>
        <div className="flex justify-center items-center h-40 bg-gray-100 rounded-md border border-dashed border-gray-300">
          <span className="text-gray-400">Reports feature coming soon</span>
        </div>
      </div>
    </div>
  );
};

export default ReportsTab;
