import React, { useState, useEffect } from 'react';
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
                label={({ name, percentage, cx, cy, midAngle, innerRadius, outerRadius }) => {
                  // Don't render labels on mobile for pie slices that are too small
                  if (isMobile && percentage < 10) return null;
                  
                  // Calculate label position
                  const RADIAN = Math.PI / 180;
                  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN) * 0.8;
                  const y = cy + radius * Math.sin(-midAngle * RADIAN) * 0.8;
                  
                  // Shorter labels for mobile
                  const displayName = isMobile ? 
                    (name.length > 5 ? name.substring(0, 5) + '..' : name) : 
                    name;
                  
                  return (
                    <text 
                      x={x} 
                      y={y} 
                      fill="#000" 
                      textAnchor="middle" 
                      dominantBaseline="central"
                      fontSize={isMobile ? 10 : 12}
                    >
                      {percentage > 10 ? `${displayName}: ${percentage}%` : `${percentage}%`}
                    </text>
                  );
                }}
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
                layout={isMobile ? "horizontal" : "vertical"}
                align={isMobile ? "center" : "right"}
                verticalAlign={isMobile ? "bottom" : "middle"}
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
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
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.savingsAnalysis}
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
                formatter={(value) => `$${value.toLocaleString()}`}
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
