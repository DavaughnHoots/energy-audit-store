import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { ChartDataPoint, SavingsChartDataPoint } from '../../types/report';
import { formatCurrency } from '../../utils/financialCalculations';

interface EnergyAnalysisProps {
  data: {
    energyBreakdown: ChartDataPoint[];
    savingsAnalysis: SavingsChartDataPoint[];
    consumption: ChartDataPoint[];
  };
  isLoading?: boolean;
}

/**
 * DashboardEnergyAnalysis component
 * 
 * Displays energy usage and savings analysis through interactive charts:
 * - Energy Breakdown (Pie Chart): Shows distribution of energy use across categories
 * - Energy Consumption (Bar Chart): Shows energy consumption by category or time
 * - Savings Analysis (Bar Chart): Compares estimated vs actual savings
 */
const DashboardEnergyAnalysis: React.FC<EnergyAnalysisProps> = ({ data, isLoading = false }) => {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if we're on mobile using a media query
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 640px)').matches);
    };
    
    // Initial check
    checkIfMobile();
    
    // Set up listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6 sm:mb-8 mx-0 flex items-center justify-center h-80">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Handle missing data with placeholder message
  if (!data || !data.energyBreakdown || !data.savingsAnalysis || !data.consumption) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6 sm:mb-8 mx-0">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Energy Analysis</h2>
        <div className="h-60 flex items-center justify-center">
          <p className="text-gray-500">No energy analysis data available.</p>
        </div>
      </div>
    );
  }

  // Add percentage calculation for pie chart display
  const energyBreakdownData = [...data.energyBreakdown];
  const totalEnergy = energyBreakdownData.reduce((sum, item) => sum + item.value, 0);
  energyBreakdownData.forEach(item => {
    item['percentage'] = ((item.value / totalEnergy) * 100).toFixed(1);
  });

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6 sm:mb-8 mx-0">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Energy Analysis</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Energy Breakdown Pie Chart */}
        <div className="bg-white p-3 sm:p-4 shadow rounded-lg">
          <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-4">Energy Breakdown</h3>
          <div className="h-60 sm:h-64 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={energyBreakdownData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={!isMobile && (({ name, percentage }) => `${percentage}%`)}
                  outerRadius={isMobile ? 65 : 80}
                  innerRadius={isMobile ? 30 : 40}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
                >
                  {energyBreakdownData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => `${value.toLocaleString()} kWh`}
                  wrapperStyle={{ fontSize: '12px' }}
                />
                <Legend 
                  layout="horizontal"
                  align="center"
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  formatter={(value) => value}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Energy Consumption Factors Bar Chart */}
        <div className="bg-white p-3 sm:p-4 shadow rounded-lg">
          <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-4">Energy Consumption Factors</h3>
          <div className="h-60 sm:h-64 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.consumption}
                margin={{ top: 5, right: 5, left: 0, bottom: 15 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                  tickMargin={5}
                />
                <YAxis 
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                  width={isMobile ? 30 : 35}
                />
                <Tooltip 
                  formatter={(value) => `${value.toLocaleString()} kWh`}
                  wrapperStyle={{ fontSize: '12px' }}
                />
                <Legend 
                  layout="horizontal"
                  align="center"
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: '11px', paddingTop: '5px' }}
                />
                <Bar dataKey="value" name="Energy (kWh)" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Savings Analysis Bar Chart */}
      <div className="bg-white p-3 sm:p-4 shadow rounded-lg">
        <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-4">Savings Analysis</h3>
        <div className="h-60 sm:h-64 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.savingsAnalysis}
              margin={{ top: 5, right: 5, left: 0, bottom: 15 }}
              barSize={isMobile ? 30 : 40}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: isMobile ? 10 : 12 }}
                tickMargin={5}
              />
              <YAxis 
                tick={{ fontSize: isMobile ? 10 : 12 }}
                width={isMobile ? 30 : 35}
                domain={[0, 'dataMax + 1']}
              />
              <Tooltip 
                formatter={(value) => formatCurrency(Number(value))}
                wrapperStyle={{ fontSize: '12px' }}
              />
              <Legend 
                layout="horizontal"
                align="center"
                verticalAlign="bottom"
                wrapperStyle={{ fontSize: '11px', paddingTop: '5px' }}
              />
              <Bar dataKey="estimatedSavings" name="Estimated Savings" fill="#3B82F6" />
              <Bar dataKey="actualSavings" name="Actual Savings" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardEnergyAnalysis;
