import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartDataPoint {
  name: string;
  value: number;
}

interface SavingsChartDataPoint {
  name: string;
  estimatedSavings: number;
  actualSavings: number;
}

interface ChartSectionProps {
  energyBreakdown?: ChartDataPoint[];
  consumption?: ChartDataPoint[];
  savingsAnalysis?: SavingsChartDataPoint[];
  isLoading?: boolean;
}

/**
 * A simplified chart component for the dashboard
 * Uses recharts to display energy data visualizations
 */
const ChartSection: React.FC<ChartSectionProps> = ({
  energyBreakdown = [],
  consumption = [],
  savingsAnalysis = [],
  isLoading = false
}) => {
  // Custom colors for consistent appearance
  const colors = {
    estimated: '#3b82f6', // blue
    actual: '#10b981',    // green
    energy: '#8b5cf6',    // purple
    consumption: '#f59e0b' // amber
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 min-h-[300px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (
    (!energyBreakdown || energyBreakdown.length === 0) &&
    (!consumption || consumption.length === 0) &&
    (!savingsAnalysis || savingsAnalysis.length === 0)
  ) {
    return (
      <div className="bg-white rounded-lg shadow p-6 min-h-[200px] flex items-center justify-center">
        <p className="text-gray-500">No chart data available yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Energy Analysis</h2>
      
      <div className="space-y-8">
        {/* Savings Analysis Chart */}
        {savingsAnalysis && savingsAnalysis.length > 0 && (
          <div>
            <h3 className="text-md font-medium mb-4">Savings by Category</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={savingsAnalysis}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis 
                    tickFormatter={(value) => 
                      new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        maximumFractionDigits: 0
                      }).format(value)
                    }
                  />
                  <Tooltip 
                    formatter={(value) => 
                      new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        maximumFractionDigits: 0
                      }).format(value as number)
                    }
                  />
                  <Legend />
                  <Bar dataKey="estimatedSavings" name="Estimated Savings" fill={colors.estimated} />
                  <Bar dataKey="actualSavings" name="Actual Savings" fill={colors.actual} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Energy Breakdown Chart */}
        {energyBreakdown && energyBreakdown.length > 0 && (
          <div>
            <h3 className="text-md font-medium mb-4">Energy Usage Breakdown</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={energyBreakdown}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Bar dataKey="value" name="Percentage" fill={colors.energy} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartSection;
