import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { ChartDataPoint, SavingsChartDataPoint } from '../../types/report';
import { formatCurrency } from '../../utils/financialCalculations';

interface ChartProps {
  data: {
    energyBreakdown: ChartDataPoint[];
    savingsAnalysis: SavingsChartDataPoint[];
    consumption: ChartDataPoint[];
  };
}

const ReportCharts: React.FC<ChartProps> = ({ data }) => {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  const [isMobile, setIsMobile] = useState(false);
  
  // Log the incoming chart data for debugging
  useEffect(() => {
    console.log('Report Charts: data received', {
      hasSavingsAnalysis: data.savingsAnalysis && data.savingsAnalysis.length > 0,
      savingsAnalysisCount: data.savingsAnalysis?.length || 0,
      savingsAnalysisData: data.savingsAnalysis,
      totalEstimatedSavings: data.savingsAnalysis?.reduce((sum, item) => sum + (item.estimatedSavings || 0), 0) || 0,
      hasEnergyBreakdown: data.energyBreakdown && data.energyBreakdown.length > 0,
      energyBreakdownCount: data.energyBreakdown?.length || 0,
      hasConsumption: data.consumption && data.consumption.length > 0,
      consumptionCount: data.consumption?.length || 0
    });
  }, [data]);
  
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

  // Add percentage for pie chart display
  const energyBreakdownData = [...data.energyBreakdown];
  const totalEnergy = energyBreakdownData.reduce((sum, item) => sum + item.value, 0);
  energyBreakdownData.forEach(item => {
    item['percentage'] = ((item.value / totalEnergy) * 100).toFixed(1);
  });
  
  // Process savings analysis data to ensure it has non-zero values for chart visibility
  const processedSavingsData = (() => {
    if (!data.savingsAnalysis || data.savingsAnalysis.length === 0) {
      console.warn('Savings analysis data is missing or empty');
      return [];
    }
    
    // Filter out items with no savings data
    const validData = data.savingsAnalysis.filter(item => 
      item.estimatedSavings !== undefined && 
      item.estimatedSavings !== null
    );
    
    if (validData.length === 0) {
      console.warn('No valid savings data for chart display');
      return [];
    }
    
    // Check if all values are zero - in this case, we'll add a small offset for visibility
    const allZeros = validData.every(item => item.estimatedSavings === 0 && item.actualSavings === 0);
    
    if (allZeros) {
      console.warn('All savings values are zero, adding visual offset');
      return validData.map(item => ({
        ...item,
        estimatedSavings: 1, // Small non-zero value for visual representation
        actualSavings: 0
      }));
    }
    
    return validData;
  })();

  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Energy Analysis</h2>
      
      <div className="bg-white p-3 sm:p-4 shadow rounded-lg mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-4">Energy Breakdown</h3>
        <div className="h-60 sm:h-80 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={energyBreakdownData}
                cx="50%"
                cy="50%"
                labelLine={false}
                // Don't use labels directly on the chart for mobile
                label={!isMobile && (({ name, percentage }) => `${percentage}%`)}
                outerRadius={isMobile ? 65 : 100}
                innerRadius={isMobile ? 30 : 50}
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
      
      <div className="bg-white p-3 sm:p-4 shadow rounded-lg mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-4">Energy Consumption Factors</h3>
        <div className="h-60 sm:h-80 overflow-hidden">
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
      
      <div className="bg-white p-3 sm:p-4 shadow rounded-lg">
        <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-4">Savings Analysis</h3>
        <div className="h-60 sm:h-80 overflow-hidden">
          {processedSavingsData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={processedSavingsData}
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
                  // Set minimum value to ensure axes are visible even with minimal data
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
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400 text-sm">No savings analysis data available</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ReportCharts;
