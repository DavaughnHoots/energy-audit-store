import React from 'react';
import { DollarSign, Battery, Leaf, Calendar, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import RecommendationCard from '@/components/audit/RecommendationCard';
import DashboardEnergyAnalysis from './DashboardEnergyAnalysis';
import EnhancedDashboardRecommendationsAdapter from './EnhancedDashboardRecommendationsAdapter';
import DataExplanationNote from './DataExplanationNote';
import { ChartDataPoint, SavingsChartDataPoint } from '../../types/report';
import { AuditRecommendation } from '../../types/energyAudit';

interface DashboardStats {
  totalSavings: {
    estimated: number;
    actual: number;
    accuracy: number;
  };
  completedAudits: number;
  activeRecommendations: number;
  implementedChanges: number;
  monthlySavings: {
    month: string;
    estimated: number;
    actual: number;
  }[];
  recommendations?: any[];
  
  // New fields for enhanced features
  energyAnalysis?: {
    energyBreakdown: ChartDataPoint[];
    consumption: ChartDataPoint[];
    savingsAnalysis: SavingsChartDataPoint[];
  };
  enhancedRecommendations?: AuditRecommendation[];
  productPreferences?: {
    categories: string[];
    budgetConstraint?: number;
  };
  latestAuditId?: string | null;
  
  // Data source metadata added in Phase 3
  dataSummary?: {
    hasDetailedData: boolean;
    isUsingDefaultData: boolean;
    dataSource: 'detailed' | 'generated' | 'empty';
  };
}

interface DashboardOverviewProps {
  stats: DashboardStats;
  isLoading: boolean;
  error: React.ReactNode | null;
  onRefresh: () => void;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ 
  stats, 
  isLoading, 
  error, 
  onRefresh 
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error}
      </div>
    );
  }

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    description,
    comparison,
  }: { 
    title: string;
    value: number | string;
    icon: any;
    description: string;
    comparison?: { actual: number; estimated: number };
  }) => (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-0">
        <div className="p-3 rounded-lg bg-green-100 self-start">
          <Icon className="h-6 w-6 text-green-600" />
        </div>
        <div className="sm:ml-4 flex-grow">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="text-xl sm:text-2xl font-semibold text-gray-900 mt-1">{value}</p>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
          {comparison && typeof comparison.estimated === 'number' && typeof comparison.actual === 'number' && (
            <div className="mt-2 text-sm flex flex-col sm:flex-row gap-2 sm:gap-0">
              <span className="text-blue-600 whitespace-nowrap">Estimated: ${comparison.estimated.toLocaleString()}</span>
              <span className="hidden sm:inline mx-2">|</span>
              <span className="text-green-600 whitespace-nowrap">Actual: ${comparison.actual.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Data Explanation Note */}
      {stats.dataSummary && (
        <DataExplanationNote
          aggregateCount={stats.completedAudits}
          hasDetailedData={stats.dataSummary.hasDetailedData}
          isUsingDefaultData={stats.dataSummary.isUsingDefaultData}
          dataSource={stats.dataSummary.dataSource}
        />
      )}
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8 mx-0 px-0">
        <StatCard
          title="Total Savings"
          value={`$${stats?.totalSavings?.actual?.toLocaleString() ?? '0'}`}
          icon={DollarSign}
          description="Actual energy cost savings"
          comparison={stats?.totalSavings ? {
            estimated: stats.totalSavings.estimated,
            actual: stats.totalSavings.actual
          } : undefined}
        />
        <StatCard
          title="Energy Audits"
          value={stats.completedAudits}
          icon={Battery}
          description="Completed energy assessments"
        />
        <StatCard
          title="Active Recommendations"
          value={stats.activeRecommendations}
          icon={Leaf}
          description="Pending improvements"
        />
        <StatCard
          title="Implemented Changes"
          value={stats.implementedChanges}
          icon={Calendar}
          description="Completed improvements"
        />
      </div>

{/* Energy Analysis Section - Enhanced Component */}
      <DashboardEnergyAnalysis 
        data={stats.energyAnalysis || {
          energyBreakdown: [],
          consumption: [],
          savingsAnalysis: []
        }} 
        isLoading={isLoading}
        isDefaultData={stats.dataSummary?.isUsingDefaultData}
        statsCount={stats.completedAudits}
        dataSource={stats.dataSummary?.dataSource}
      />

      {/* Enhanced Recommendations Section - Using the unified adapter */}
      <EnhancedDashboardRecommendationsAdapter
        recommendations={stats.enhancedRecommendations || []}
        userCategories={stats.productPreferences?.categories || []}
        budgetConstraint={stats.productPreferences?.budgetConstraint}
        auditId={stats.latestAuditId}
        onRefresh={onRefresh}
        isLoading={isLoading}
        isDefaultData={stats.dataSummary?.isUsingDefaultData}
        dataSource={stats.dataSummary?.dataSource}
      />
    </div>
  );
};

export default DashboardOverview;
