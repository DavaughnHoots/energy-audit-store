import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { ChartDataPoint, SavingsChartDataPoint } from '../../types/report';

interface ChartProps {
  data: {
    energyBreakdown: ChartDataPoint[];
    savingsAnalysis: SavingsChartDataPoint[];
    consumption: ChartDataPoint[];
  };
}

const ReportCharts: React.FC<ChartProps> = ({ data }) => {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Add percentage for pie chart display
  const energyBreakdownData = [...data.energyBreakdown];
  const totalEnergy = energyBreakdownData.reduce((sum, item) => sum + item.value, 0);
  energyBreakdownData.forEach(item => {
    item['percentage'] = ((item.value / totalEnergy) * 100).toFixed(1);
  });

  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Energy Analysis</h2>
      
      <div className="bg-white p-4 shadow rounded-lg mb-6">
        <h3 className="text-lg font-medium mb-4">Energy Breakdown</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={energyBreakdownData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {energyBreakdownData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value.toLocaleString()} kWh`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="bg-white p-4 shadow rounded-lg mb-6">
        <h3 className="text-lg font-medium mb-4">Energy Consumption Factors</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.consumption}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `${value.toLocaleString()} kWh`} />
              <Legend />
              <Bar dataKey="value" name="Energy (kWh)" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="bg-white p-4 shadow rounded-lg">
        <h3 className="text-lg font-medium mb-4">Savings Analysis</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.savingsAnalysis}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value) => `$${value.toLocaleString()}`}
              />
              <Legend />
              <Bar dataKey="estimatedSavings" name="Estimated Savings" fill="#3B82F6" />
              <Bar dataKey="actualSavings" name="Actual Savings" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
};

export default ReportCharts;
