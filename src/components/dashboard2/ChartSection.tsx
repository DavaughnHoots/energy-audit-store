import React from 'react';
// Add PieChart and other components to imports
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, Label
} from 'recharts';

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
// Update colors to match your theme
const colors = {
  estimated: '#2563eb', // primary blue
  actual: '#10b981',    // teal green
  energy: {
    electricity: '#2563eb', // electric blue
    gas: '#10b981'          // natural gas teal
  },
  consumption: '#2563eb'    // blue for consumption bars
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

      {/* Energy Breakdown Chart */}
      {energyBreakdown && energyBreakdown.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Energy Breakdown</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={energyBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={0}
                    dataKey="value"
                    nameKey="name"
                    label={({name, percent}) => `${(percent * 100).toFixed(1)}%`}
                  >
                    {energyBreakdown.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? colors.energy.electricity : colors.energy.gas}
                      />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      {/* Energy Consumption Chart */}
      {consumption && consumption.length > 0 && (
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-medium mb-4">Energy Consumption Factors</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={consumption}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis
                  label={{ value: 'Energy (kWh)', angle: -90, position: 'insideLeft' }}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip formatter={(value) => `${value} kWh`} />
                <Legend />
                <Bar dataKey="value" name="Energy (kWh)" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

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

      </div>
    </div>
  );
};

export default ChartSection;
