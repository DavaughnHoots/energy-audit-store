import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { InfoIcon } from 'lucide-react';
import { ChartDataPoint, SavingsChartDataPoint } from '../../types/report';
import { formatCurrency } from '../../utils/financialCalculations';

// Default data to use when no data is provided
const DEFAULT_ENERGY_BREAKDOWN: ChartDataPoint[] = [
  { name: 'HVAC', value: 42 },
  { name: 'Lighting', value: 18 },
  { name: 'Appliances', value: 15 },
  { name: 'Electronics', value: 14 },
  { name: 'Other', value: 11 }
];

const DEFAULT_CONSUMPTION: ChartDataPoint[] = [
  { name: 'Living Room', value: 28 },
  { name: 'Kitchen', value: 24 },
  { name: 'Bedrooms', value: 18 },
  { name: 'Bathroom', value: 10 },
  { name: 'Outdoor', value: 20 }
];

const DEFAULT_SAVINGS: SavingsChartDataPoint[] = [
  { name: 'HVAC Improvements', estimatedSavings: 350, actualSavings: 320 },
  { name: 'Lighting Efficiency', estimatedSavings: 180, actualSavings: 165 },
  { name: 'Appliance Upgrades', estimatedSavings: 220, actualSavings: 190 },
  { name: 'Insulation', estimatedSavings: 150, actualSavings: 130 }
];

interface EnergyAnalysisProps {
  data: {
    energyBreakdown: ChartDataPoint[];
    savingsAnalysis: SavingsChartDataPoint[];
    consumption: ChartDataPoint[];
  };
  isLoading?: boolean;
  isDefaultData?: boolean;
  statsCount?: number;
  dataSource?: 'detailed' | 'generated' | 'empty';
}

/**
 * DashboardEnergyAnalysis component
 * 
 * Displays energy usage and savings analysis through interactive charts using the same
 * rendering approach as the ReportCharts component for consistency.
 * 
 * Charts:
 * - Energy Breakdown (Pie Chart): Shows distribution of energy use across categories
 * - Energy Consumption (Bar Chart): Shows energy consumption by category or time
 * - Savings Analysis (Bar Chart): Compares estimated vs actual savings
 */
const DashboardEnergyAnalysis: React.FC<EnergyAnalysisProps> = ({ 
  data, 
  isLoading = false,
  isDefaultData = false,
  statsCount = 0,
  dataSource = 'detailed'
}) => {
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

  // Log the incoming chart data for debugging (from ReportCharts)
  useEffect(() => {
    console.log('Dashboard Energy Analysis: data received', {
      hasSavingsAnalysis: data?.savingsAnalysis && data.savingsAnalysis.length > 0,
      savingsAnalysisCount: data?.savingsAnalysis?.length || 0,
      savingsAnalysisData: data?.savingsAnalysis,
      totalEstimatedSavings: data?.savingsAnalysis?.reduce((sum, item) => sum + (item.estimatedSavings || 0), 0) || 0,
      hasEnergyBreakdown: data?.energyBreakdown && data.energyBreakdown.length > 0,
      energyBreakdownCount: data?.energyBreakdown?.length || 0,
      hasConsumption: data?.consumption && data.consumption.length > 0,
      consumptionCount: data?.consumption?.length || 0,
      dataSource: dataSource
    });
  }, [data, dataSource]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6 sm:mb-8 mx-0 flex items-center justify-center h-80">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Safely extract data with fallbacks to default data instead of empty arrays
  const energyBreakdownData = (data?.energyBreakdown && data.energyBreakdown.length > 0) 
    ? data.energyBreakdown 
    : DEFAULT_ENERGY_BREAKDOWN;
    
  const consumptionData = (data?.consumption && data.consumption.length > 0)
    ? data.consumption
    : DEFAULT_CONSUMPTION;
    
  const savingsAnalysisData = (data?.savingsAnalysis && data.savingsAnalysis.length > 0)
    ? data.savingsAnalysis
    : DEFAULT_SAVINGS;
  
  // Track whether we're using default data for each chart
  const isUsingDefaultEnergyBreakdown = data?.energyBreakdown?.length === 0 || !data?.energyBreakdown;
  const isUsingDefaultConsumption = data?.consumption?.length === 0 || !data?.consumption;
  const isUsingDefaultSavings = data?.savingsAnalysis?.length === 0 || !data?.savingsAnalysis;
  
  // Only show placeholder in truly catastrophic scenario (should never happen)
  if (energyBreakdownData.length === 0 && consumptionData.length === 0 && savingsAnalysisData.length === 0) {
    console.error('Critical error: Both incoming data and default data are missing');
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6 sm:mb-8 mx-0">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Energy Analysis</h2>
        <div className="h-60 flex flex-col items-center justify-center">
          <p className="text-gray-500 mb-4">Error loading energy analysis data.</p>
          <a 
            href="/energy-audit" 
            className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
          >
            Complete an Energy Audit
          </a>
        </div>
      </div>
    );
  }

  // Add percentage for pie chart display (from ReportCharts)
  const processedEnergyBreakdown = [...energyBreakdownData];
  const totalEnergy = processedEnergyBreakdown.reduce((sum, item) => sum + item.value, 0);
  processedEnergyBreakdown.forEach(item => {
    item['percentage'] = ((item.value / totalEnergy) * 100).toFixed(1);
  });
  
  // Process savings analysis data to ensure it has non-zero values for chart visibility (from ReportCharts)
  const processedSavingsData = (() => {
    if (savingsAnalysisData.length === 0) {
      console.warn('Savings analysis data is missing or empty');
      return [];
    }
    
    // Filter out items with no savings data
    const validData = savingsAnalysisData.filter(item => 
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
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6 sm:mb-8 mx-0">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Energy Analysis</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Energy Breakdown Pie Chart */}
        <div className="bg-white p-3 sm:p-4 shadow rounded-lg mb-4 sm:mb-6">
          <div className="flex justify-between items-center mb-2 sm:mb-4">
            <h3 className="text-base sm:text-lg font-medium">Energy Breakdown</h3>
            {(dataSource === 'generated' || isUsingDefaultEnergyBreakdown) && (
              <div className="flex items-center bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded">
                <InfoIcon className="h-3 w-3 mr-1" />
                <span>Sample Data</span>
              </div>
            )}
          </div>
          <div className="h-60 sm:h-80 overflow-hidden">
            {processedEnergyBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={processedEnergyBreakdown}
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
                    {processedEnergyBreakdown.map((_, index) => (
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
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400 text-sm">No energy breakdown data available</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Energy Consumption Factors Bar Chart */}
        <div className="bg-white p-3 sm:p-4 shadow rounded-lg mb-4 sm:mb-6">
          <div className="flex justify-between items-center mb-2 sm:mb-4">
            <h3 className="text-base sm:text-lg font-medium">Energy Consumption Factors</h3>
            {(dataSource === 'generated' || isUsingDefaultConsumption) && (
              <div className="flex items-center bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded">
                <InfoIcon className="h-3 w-3 mr-1" />
                <span>Sample Data</span>
              </div>
            )}
          </div>
          <div className="h-60 sm:h-80 overflow-hidden">
            {consumptionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={consumptionData}
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
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400 text-sm">No consumption data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Savings Analysis Bar Chart */}
      <div className="bg-white p-3 sm:p-4 shadow rounded-lg">
        <div className="flex justify-between items-center mb-2 sm:mb-4">
          <h3 className="text-base sm:text-lg font-medium">Savings Analysis</h3>
          {(dataSource === 'generated' || isUsingDefaultSavings) && (
            <div className="flex items-center bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded">
              <InfoIcon className="h-3 w-3 mr-1" />
              <span>Sample Data</span>
            </div>
          )}
        </div>
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
                  // Auto-calculate domain to handle varying financial values
                  domain={[0, (dataMax: number) => Math.max(10, dataMax * 1.1)]}
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
    </div>
  );
};

export default DashboardEnergyAnalysis;
