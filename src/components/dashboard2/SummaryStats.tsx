import React from 'react';
import { TrendingUp, DollarSign, Award, Activity } from 'lucide-react';

interface DashboardStats {
  totalSavings: {
    estimated: number;
    actual: number;
    accuracy?: number;
  };
  completedAudits?: number;
  activeRecommendations?: number;
  implementedChanges?: number;
}

interface SummaryStatsProps {
  stats: DashboardStats;
}

/**
 * A simple, clean summary stats component for the dashboard
 * This displays key metrics at the top of the dashboard
 */
const SummaryStats: React.FC<SummaryStatsProps> = ({ stats }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  const items = [
    {
      icon: <DollarSign className="h-8 w-8 text-green-500" />,
      value: formatCurrency(stats.totalSavings.estimated),
      label: 'Estimated Annual Savings',
      color: 'bg-green-50 border-green-100'
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-blue-500" />,
      value: stats.activeRecommendations || 0,
      label: 'Active Recommendations',
      color: 'bg-blue-50 border-blue-100'
    },
    {
      icon: <Award className="h-8 w-8 text-purple-500" />,
      value: stats.implementedChanges || 0,
      label: 'Implemented Changes',
      color: 'bg-purple-50 border-purple-100'
    },
    {
      icon: <Activity className="h-8 w-8 text-orange-500" />,
      value: stats.completedAudits || 0,
      label: 'Completed Audits',
      color: 'bg-orange-50 border-orange-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item, index) => (
        <div
          key={index}
          className={`p-6 rounded-lg shadow-sm border ${item.color} flex flex-col items-center text-center`}
        >
          <div className="mb-2">{item.icon}</div>
          <div className="text-2xl font-bold">{item.value}</div>
          <div className="text-sm text-gray-500">{item.label}</div>
        </div>
      ))}
    </div>
  );
};

export default SummaryStats;
