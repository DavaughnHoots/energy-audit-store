import React from 'react';
import { DollarSign, ClipboardList, Leaf, CheckSquare } from 'lucide-react';

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
 * A summary stats component that matches the design reference
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
      icon: <DollarSign className="h-6 w-6 text-green-500" />,
      title: 'Total Savings',
      value: '$88.00',
      description: 'Actual energy cost savings',
      bgColor: 'bg-green-50'
    },
    {
      icon: <ClipboardList className="h-6 w-6 text-blue-500" />,
      title: 'Energy Audits',
      value: stats.completedAudits || '51',
      description: 'Completed energy assessments',
      bgColor: 'bg-blue-50'
    },
    {
      icon: <Leaf className="h-6 w-6 text-green-500" />,
      title: 'Active Recommendations',
      value: stats.activeRecommendations || '159',
      description: 'Pending improvements',
      bgColor: 'bg-green-50'
    },
    {
      icon: <CheckSquare className="h-6 w-6 text-green-500" />,
      title: 'Implemented Changes',
      value: stats.implementedChanges || '2',
      description: 'Completed improvements',
      bgColor: 'bg-green-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item, index) => (
        <div
          key={index}
          className={`flex p-4 rounded-md ${item.bgColor}`}
        >
          <div className="flex items-center justify-center h-12 w-12 rounded-md bg-white mr-4">
            {item.icon}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-600">{item.title}</div>
            <div className="text-2xl font-bold">{item.value}</div>
            <div className="text-xs text-gray-500">{item.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SummaryStats;
