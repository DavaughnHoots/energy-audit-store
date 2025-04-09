import React, { ReactNode, useState } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ReportsTab, PropertySettingsTab, BadgesTab } from './index';

interface SimpleDashboardLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  lastUpdated?: string;
  isLoading?: boolean;
  onRefresh?: () => void;
}

/**
 * A clean, simplified dashboard layout component
 * This provides the basic structure for the new dashboard
 */
const SimpleDashboardLayout: React.FC<SimpleDashboardLayoutProps> = ({
  children,
  title = "Dashboard",
  subtitle = "Track your energy savings and efficiency improvements",
  lastUpdated,
  isLoading = false,
  onRefresh
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h1>
              <p className="text-sm sm:text-base text-gray-600">
                {subtitle}
              </p>
            </div>
            <div className="flex items-center gap-4 mt-4 sm:mt-0">
              <Button
                onClick={() => navigate('/settings')}
                className="flex items-center justify-center gap-2 text-sm"
                variant="outline"
                size="sm"
              >
                <Settings className="h-4 w-4" />
                <span>User Settings</span>
              </Button>
              {lastUpdated && (
                <p className="text-xs sm:text-sm text-gray-500">
                  Last updated: {new Date(lastUpdated).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex space-x-8">
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reports'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('reports')}
            >
              Reports
            </button>
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'badges'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('badges')}
            >
              Achievements
            </button>
            <button
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'property-settings'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('property-settings')}
            >
              Property Settings
            </button>
          </div>
        </div>
        
        {/* Loading state */}
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
        ) : (
          // Content - conditionally show content based on active tab
          <div className="space-y-6">
            {activeTab === 'overview' ? (
              children
            ) : activeTab === 'reports' ? (
              <ReportsTab />
            ) : activeTab === 'badges' ? (
              <BadgesTab />
            ) : activeTab === 'property-settings' ? (
              <PropertySettingsTab />
            ) : (
              children
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleDashboardLayout;
