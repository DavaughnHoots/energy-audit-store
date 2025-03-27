import React from 'react';
import { DollarSign, Battery, Leaf, Calendar, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import RecommendationCard from '@/components/audit/RecommendationCard';

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
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

      {/* Savings Chart */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-8 overflow-hidden">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Savings Trend</h2>
        <div className="h-[400px] sm:h-96 -mx-4 sm:mx-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={stats.monthlySavings}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [`$${value}`, 'Savings']}
                labelFormatter={(label: string) => `Month: ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                name="Estimated Savings"
                dataKey="estimated"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: '#3B82F6' }}
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                name="Actual Savings"
                dataKey="actual"
                stroke="#22C55E"
                strokeWidth={2}
                dot={{ fill: '#22C55E' }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recommendations Section */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h2>
        {stats.recommendations && stats.recommendations.length > 0 ? (
          <div className="space-y-4 -mx-4 sm:mx-0">
            {stats.recommendations.map((recommendation) => (
              <RecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
                onUpdate={onRefresh}
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <p>No recommendations available.</p>
            <button
              onClick={() => window.location.href = '/energy-audit'}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Start New Energy Audit
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardOverview;
