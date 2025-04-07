import React, { useState } from 'react';
import { CalendarIcon, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Reports tab for the dashboard
 * Shows energy audit reports and allows downloading/viewing
 */
const ReportsTab: React.FC = () => {
  // Mock data for previous reports
  const [reports] = useState([
    {
      id: 1,
      date: 'April 6, 2025',
      title: 'Energy Audit',
      location: '400 East Front Street',
      recommendations: 4
    },
    {
      id: 2,
      date: 'April 5, 2025',
      title: 'Energy Audit',
      location: '400 East Front Street',
      recommendations: 4
    },
    {
      id: 3,
      date: 'April 5, 2025',
      title: 'Energy Audit',
      location: '400 East Front Street',
      recommendations: 2
    },
    {
      id: 4,
      date: 'April 5, 2025',
      title: 'Energy Audit',
      location: '400 East Front Street',
      recommendations: 2
    },
    {
      id: 5,
      date: 'April 5, 2025',
      title: 'Energy Audit',
      location: '400 East Front Street, Unit 210',
      recommendations: 4
    }
  ]);

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Energy Audit Reports</h2>
        <p className="text-gray-600 mb-6">
          Generate and download comprehensive reports based on your energy audits. 
          These reports include detailed analysis, recommendations, and potential 
          savings information.
        </p>
      </div>

      {/* Report Contents card */}
      <div className="bg-blue-50 rounded-lg p-6 mb-6">
        <h3 className="text-blue-800 font-medium mb-3">Report Contents</h3>
        
        <ul className="space-y-2 text-blue-700">
          <li className="flex items-start">
            <span className="text-blue-500 mr-2">•</span>
            Executive summary of energy usage
          </li>
          <li className="flex items-start">
            <span className="text-blue-500 mr-2">•</span>
            Detailed analysis of current conditions
          </li>
          <li className="flex items-start">
            <span className="text-blue-500 mr-2">•</span>
            Prioritized improvement recommendations
          </li>
          <li className="flex items-start">
            <span className="text-blue-500 mr-2">•</span>
            Estimated cost savings and ROI calculations
          </li>
          <li className="flex items-start">
            <span className="text-blue-500 mr-2">•</span>
            Product recommendations with efficiency ratings
          </li>
          <li className="flex items-start">
            <span className="text-blue-500 mr-2">•</span>
            Implementation timeline suggestions
          </li>
        </ul>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Button className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
          <Download size={16} />
          Download PDF Report
        </Button>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
          <Eye size={16} />
          View Interactive Report
        </Button>
      </div>

      {/* Previous Reports section */}
      <div className="mt-10">
        <h3 className="text-lg font-medium mb-4">Previous Reports</h3>
        
        <div className="space-y-3">
          {reports.map(report => (
            <div key={report.id} className="border rounded-lg p-4 flex justify-between items-center">
              <div>
                <div className="flex items-center text-gray-500 mb-1">
                  <CalendarIcon size={16} className="mr-1" />
                  <span>{report.date}</span>
                </div>
                <div className="font-medium">{report.title}</div>
                <div className="text-gray-600 text-sm">{report.location}</div>
                <div className="text-gray-600 text-sm">{report.recommendations} Recommendations</div>
              </div>
              <Button 
                variant="ghost" 
                className="text-green-600 hover:text-green-700 hover:bg-green-50 flex items-center gap-1"
              >
                View <span className="ml-1">→</span>
              </Button>
            </div>
          ))}
        </div>
        
        {/* Pagination */}
        <div className="flex justify-center mt-6">
          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-md hover:bg-gray-100">&lt;</button>
            <button className="p-2 rounded-md bg-green-600 text-white">1</button>
            <button className="p-2 rounded-md hover:bg-gray-100">2</button>
            <button className="p-2 rounded-md hover:bg-gray-100">3</button>
            <button className="p-2 rounded-md hover:bg-gray-100">4</button>
            <span className="px-2">...</span>
            <button className="p-2 rounded-md hover:bg-gray-100">11</button>
            <button className="p-2 rounded-md hover:bg-gray-100">&gt;</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsTab;
