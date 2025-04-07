import React, { ReactNode } from 'react';
import { Settings, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{title}</h1>
          <div className="flex flex-col gap-4">
            <p className="text-sm sm:text-base text-gray-600">
              {subtitle}
            </p>
            <div className="flex flex-col sm:flex-row sm:justify-end items-stretch sm:items-center gap-3">
              {onRefresh && (
                <Button
                  onClick={onRefresh}
                  className="flex items-center justify-center gap-2 text-sm"
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh Data</span>
                </Button>
              )}
              <Button
                onClick={() => navigate('/settings/property')}
                className="flex items-center justify-center gap-2 text-sm"
                size="sm"
              >
                <Settings className="h-4 w-4" />
                <span>Property Settings</span>
              </Button>
              {lastUpdated && (
                <p className="text-xs sm:text-sm text-gray-500 text-center sm:text-right">
                  Last updated: {new Date(lastUpdated).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Loading state */}
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
        ) : (
          // Content
          <div className="space-y-6">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleDashboardLayout;
