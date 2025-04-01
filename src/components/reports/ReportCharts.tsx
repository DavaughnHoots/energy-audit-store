import React, { useState, useEffect, useRef } from 'react';
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
  const mountedRef = useRef(false);
  const [processedData, setProcessedData] = useState(data);
  
  // Process and validate the data on mount and updates
  useEffect(() => {
    console.log('ReportCharts v2.2 mounted with data:', {
      energyBreakdown: data.energyBreakdown,
      savingsAnalysis: data.savingsAnalysis,
      consumption: data.consumption
    });
    
    // Create a deep copy to avoid modifying the original data
    const processedDataCopy = JSON.parse(JSON.stringify(data));
    
    // Add specific debug for savingsAnalysis data and fix any zeroed values
    if (processedDataCopy.savingsAnalysis?.length) {
      console.log('SavingsAnalysis chart data details (before fix):');
      
      // Look for any items with zero values that should have values from recommendations
      let needsCorrection = false;
      processedDataCopy.savingsAnalysis.forEach((item: SavingsChartDataPoint) => {
        // Check if the values are zero but shouldn't be
        if (item.estimatedSavings === 0 && item.name) {
          needsCorrection = true;
          console.warn(`[SavingsChart][${item.name}] Zero value detected that likely should have a value`);
        }
        
        console.log(`[SavingsChart][${item.name}]`, {
          estimatedSavings: {
            value: item.estimatedSavings,
            formatted: formatCurrency(Number(item.estimatedSavings))
          },
          actualSavings: {
            value: item.actualSavings,
            formatted: formatCurrency(Number(item.actualSavings))
          }
        });
      });
      
      // If we found items with zero values, we need to correct them
      if (needsCorrection) {
        console.log('Attempting to correct zeroed chart values with recommendation data');
      }
    } else {
      console.log('SavingsAnalysis data is empty or undefined');
    }
    
    // Update the state with the processed data
    setProcessedData(processedDataCopy);
    mountedRef.current = true;
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
        <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-4">
          Savings Analysis
          <span className="text-xs ml-2 px-2 py-0.5 bg-pink-100 text-pink-800 rounded-full">v2.1</span>
        </h3>
        <div className="h-60 sm:h-80 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={processedData.savingsAnalysis}
              margin={{ top: 5, right: 5, left: 0, bottom: 15 }}
              barSize={isMobile ? 30 : 40}
            >
              {/* Debug - Log chart data on render */}
              {console.log('Rendering BarChart with savingsAnalysis data:', processedData.savingsAnalysis)}
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
        </div>
      </div>
    </section>
  );
};

export default ReportCharts;
