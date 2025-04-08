import React, { useState } from 'react';
// Add PieChart and other components to imports
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, Label
} from 'recharts';
import { transformConsumptionToRoomBased } from '@/utils/energyBreakdownCalculations';
import { Clock, Calendar } from 'lucide-react';

interface ChartDataPoint {
  name: string;
  value: number;
}

interface SavingsChartDataPoint {
  name: string;
  estimatedSavings: number;
  actualSavings: number;
}

// Define energy colors interface with index signature
interface EnergyColors {
  hvac: string;
  lighting: string;
  appliances: string;
  electronics: string;
  other: string;
  electricity: string;
  gas: string;
  // Room-based categories
  livingroom: string;
  kitchen: string;
  bedrooms: string;
  bathroom: string;
  outdoor: string;
  [key: string]: string;  // Index signature for dynamic access
}

interface ChartSectionProps {
  energyBreakdown?: ChartDataPoint[];
  consumption?: ChartDataPoint[];
  savingsAnalysis?: SavingsChartDataPoint[];
  isLoading?: boolean;
  auditData?: any; // Add audit data prop for room-based calculations
}

/**
 * A simplified chart component for the dashboard
 * Uses recharts to display energy data visualizations
 */
const ChartSection: React.FC<ChartSectionProps> = ({
  energyBreakdown = [],
  consumption = [],
  savingsAnalysis = [],
  isLoading = false,
  auditData = null
}) => {
  // State to toggle between abstract and room-based views
  const [showRoomBased, setShowRoomBased] = useState(true);
  
  // State to toggle between monthly and annual views
  const [showMonthly, setShowMonthly] = useState(true);
  
  // Calculate room-based consumption if we have data
  const roomBasedConsumption = auditData 
    ? transformConsumptionToRoomBased(consumption, auditData)
    : [];
  
  // Function to convert data to monthly or annual view
  const applyTimeframeConversion = (data: ChartDataPoint[]) => {
    if (!data || data.length === 0) return [];
    
    return data.map(item => ({
      ...item,
      value: showMonthly ? Math.round(item.value / 12) : item.value
    }));
  };
  
  // Apply timeframe conversion to the data
  const timeframeAdjustedConsumption = applyTimeframeConversion(consumption);
  const timeframeAdjustedRoomConsumption = applyTimeframeConversion(roomBasedConsumption);
  
  // Function to format energy values with appropriate units
  const formatEnergyValue = (value: number): string => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)} MWh`;
    }
    return `${value} kWh`;
  };
  
  // Get the current timeframe unit for display
  const timeframeUnit = showMonthly ? 'month' : 'year';

  // Update colors to support multiple categories
  const colors = {
    estimated: '#2563eb', // primary blue
    actual: '#10b981',    // teal green
    energy: {
      hvac: '#0088FE',       // Blue
      lighting: '#00C49F',   // Teal
      appliances: '#FFBB28', // Yellow
      electronics: '#FF8042', // Orange
      other: '#8884D8',      // Purple
      electricity: '#2563eb', // Keep original colors for backward compatibility
      gas: '#10b981',         // Keep original colors for backward compatibility
      // Room-based colors
      livingroom: '#4287f5',  // Blue
      kitchen: '#f5a742',     // Amber
      bedrooms: '#42c5f5',    // Light blue
      bathroom: '#8e42f5',    // Purple
      outdoor: '#42f575'      // Green
    } as EnergyColors,
    consumption: '#2563eb'    // blue for consumption bars
  };

  // Room tooltips with contextual comparisons
  const getRoomTooltip = (roomName: string, value: number): string => {
    const baseDescriptions: Record<string, string> = {
      'Living Room': 'Includes entertainment devices, main lighting, and HVAC usage in living spaces',
      'Kitchen': 'Includes refrigerator, oven, dishwasher, and kitchen appliances',
      'Bedrooms': 'Includes bedroom lighting, electronics, and heating/cooling',
      'Bathroom': 'Includes water heating, ventilation, and lighting in bathrooms',
      'Outdoor': 'Includes exterior lighting, garage, lawn equipment, and outdoor appliances'
    };
    
    // Contextual comparisons based on energy usage
    const getContextualComparison = (value: number, monthly: boolean): string => {
      // Adjust value if we're in annual mode but want monthly comparisons
      const monthlyValue = monthly ? value : Math.round(value / 12);
      
      switch(roomName) {
        case 'Living Room':
          if (monthlyValue > 500) return `Equivalent to running 5 gaming consoles 24/7 or 30 LED TVs for 4 hours daily`;
          if (monthlyValue > 200) return `Equivalent to running 2 gaming consoles 24/7 or 15 LED TVs for 4 hours daily`;
          return `Equivalent to running 10 LED TVs for 4 hours daily`;
          
        case 'Kitchen':
          if (monthlyValue > 400) return `Equivalent to 220 loads of laundry or operating your refrigerator for 3 months`;
          if (monthlyValue > 200) return `Equivalent to 110 loads of laundry or operating your refrigerator for 6 weeks`;
          return `Equivalent to 50 loads of laundry or operating your refrigerator for 3 weeks`;
          
        case 'Bedrooms':
          if (monthlyValue > 300) return `Equivalent to running a bedroom AC for 10 hours daily or charging 500 phones daily`;
          if (monthlyValue > 150) return `Equivalent to running a bedroom AC for 5 hours daily or charging 250 phones daily`;
          return `Equivalent to charging 100 phones daily`;
          
        case 'Bathroom':
          if (monthlyValue > 200) return `Equivalent to 20 hours of hot showers daily or running a heat lamp for 7 hours daily`;
          if (monthlyValue > 100) return `Equivalent to 10 hours of hot showers daily or running a heat lamp for 3 hours daily`;
          return `Equivalent to 5 hours of hot showers daily`;
          
        case 'Outdoor':
          if (monthlyValue > 400) return `Equivalent to running 10 hours of landscape lighting daily or a pool pump for 8 hours daily`;
          if (monthlyValue > 200) return `Equivalent to running 5 hours of landscape lighting daily or a pool pump for 4 hours daily`;
          return `Equivalent to running 2 hours of landscape lighting daily`;
          
        default:
          return '';
      }
    };
    
    const baseDescription = baseDescriptions[roomName] || '';
    const contextComparison = getContextualComparison(value, showMonthly);
    
    return baseDescription + (contextComparison ? '. ' + contextComparison : '');
  };

  // Custom tooltip formatter that includes room descriptions and contextual comparisons
  const roomTooltipFormatter = (value: number, name: string, entry: any) => {
    const roomDescription = getRoomTooltip(entry.name, value);
    return [
      `${formatEnergyValue(value)}/${timeframeUnit}`, 
      `${entry.name}${roomDescription ? ' - ' + roomDescription : ''}`
    ];
  };
  
  // Standard tooltip formatter for non-room-based data
  const standardTooltipFormatter = (value: number) => {
    return `${formatEnergyValue(value)}/${timeframeUnit}`;
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
    (!roomBasedConsumption || roomBasedConsumption.length === 0) &&
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Energy Breakdown Chart */}
        {energyBreakdown && energyBreakdown.length > 0 && (
          <div className="mb-0">
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
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({name, percent}) => `${(percent * 100).toFixed(1)}%`}
                  >
                    {energyBreakdown.map((entry, index) => {
                      // Convert entry name to lowercase for color mapping and handle spaces
                      const colorKey = entry.name.toLowerCase().replace(/\s+/g, '');
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={colors.energy[colorKey] || `#${Math.floor(Math.random()*16777215).toString(16)}`}
                        />
                      );
                    })}
                  </Pie>
                  <Legend />
                  <Tooltip formatter={(value) => `${value} kWh`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Energy Consumption Chart - Room-based or Abstract */}
        {(showRoomBased ? roomBasedConsumption : consumption) && 
          (showRoomBased ? roomBasedConsumption.length > 0 : consumption.length > 0) && (
          <div className="mt-0">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Energy Consumption Factors</h3>
              <div className="flex space-x-2">
                {/* Time period toggle */}
                <button 
                  className="text-sm flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-1 px-2 rounded"
                  onClick={() => setShowMonthly(!showMonthly)}
                >
                  {showMonthly ? <Calendar size={14} /> : <Clock size={14} />}
                  {showMonthly ? 'Annual' : 'Monthly'} View
                </button>
                
                {/* Room/Technical toggle */}
                {roomBasedConsumption && roomBasedConsumption.length > 0 && consumption && consumption.length > 0 && (
                  <button 
                    className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 py-1 px-2 rounded"
                    onClick={() => setShowRoomBased(!showRoomBased)}
                  >
                    Show {showRoomBased ? 'Technical' : 'Room-Based'} View
                  </button>
                )}
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={showRoomBased 
                    ? timeframeAdjustedRoomConsumption 
                    : timeframeAdjustedConsumption}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis
                    label={{ 
                      value: `Energy (${showMonthly ? 'kWh/month' : 'kWh/year'})`, 
                      angle: -90, 
                      position: 'outside', 
                      dx: -35 
                    }}
                    tickFormatter={(value) => {
                      if (value >= 1000) {
                        return `${(value/1000).toFixed(1)}k`;
                      }
                      return value;
                    }}
                    width={60} // Increase width to give more space for labels
                  />
                  <Tooltip 
                    formatter={showRoomBased ? roomTooltipFormatter : standardTooltipFormatter} 
                  />
                  <Legend />
                  <Bar 
                    dataKey="value" 
                    name={`Energy (${showMonthly ? 'kWh/month' : 'kWh/year'})`}
                    fill={colors.consumption}
                    // Use room-specific colors for the room-based view
                    {...(showRoomBased && {
                      fill: undefined,
                      children: timeframeAdjustedRoomConsumption.map((entry, index) => {
                        const colorKey = entry.name.toLowerCase().replace(/\s+/g, '');
                        return (
                          <Cell
                            key={`consumption-cell-${index}`}
                            fill={colors.energy[colorKey] || "#2563eb"}
                          />
                        );
                      })
                    })}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-sm text-gray-500 italic">
              {showRoomBased 
                ? `This chart shows estimated energy consumption by room per ${timeframeUnit}, helping you target the highest-usage areas for efficiency improvements.`
                : `This chart shows energy consumption factors per ${timeframeUnit}. Toggle to Room-Based view for more intuitive insights.`
              }
            </div>
          </div>
        )}
      </div>

      <div className="space-y-8 mt-8 pt-8 border-t border-gray-200">
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
