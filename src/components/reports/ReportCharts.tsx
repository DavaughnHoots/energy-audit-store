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
  recommendations?: any[]; // Optional recommendations array for data correction
}

const ReportCharts: React.FC<ChartProps> = ({ data, recommendations = [] }) => {
  // Method to get default values by recommendation name
  const getDefaultValuesByName = (name: string): { estimatedSavings: number, actualSavings: number } => {
    // Default values based on category
    const defaultValuesByCategory = {
      'hvac': { estimatedSavings: 450, actualSavings: 0 },
      'lighting': { estimatedSavings: 200, actualSavings: 0 },
      'insulation': { estimatedSavings: 350, actualSavings: 0 },
      'windows': { estimatedSavings: 300, actualSavings: 0 },
      'appliances': { estimatedSavings: 150, actualSavings: 0 },
      'water': { estimatedSavings: 250, actualSavings: 0 },
      'dehumidification': { estimatedSavings: 120, actualSavings: 0 },
      'thermostat': { estimatedSavings: 100, actualSavings: 0 }
    };
    
    // Try to determine the category from the name
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('hvac') || lowerName.includes('heating') || lowerName.includes('cooling')) {
      return defaultValuesByCategory['hvac'];
    } else if (lowerName.includes('light') || lowerName.includes('bulb')) {
      return defaultValuesByCategory['lighting']; 
    } else if (lowerName.includes('insulat')) {
      return defaultValuesByCategory['insulation'];
    } else if (lowerName.includes('window')) {
      return defaultValuesByCategory['windows'];
    } else if (lowerName.includes('appliance') || lowerName.includes('refrigerator')) {
      return defaultValuesByCategory['appliances'];
    } else if (lowerName.includes('water')) {
      return defaultValuesByCategory['water'];
    } else if (lowerName.includes('dehumidif')) {
      return defaultValuesByCategory['dehumidification'];
    } else if (lowerName.includes('thermostat')) {
      return defaultValuesByCategory['thermostat'];
    }
    
    // Default fallback
    return { estimatedSavings: 200, actualSavings: 0 };
  };
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
      
      // Enhanced debugging for recommendations data
      console.log('Recommendations received for correction:', {
        count: recommendations.length,
        titles: recommendations.map((r: any) => r.title),
        estimatedSavings: recommendations.map((r: any) => r.estimatedSavings),
        actualSavings: recommendations.map((r: any) => r.actualSavings || 0)
      });
      
      // If we found items with zero values and we have recommendation data, fix the values
      if (needsCorrection && recommendations.length > 0) {
        console.log('Attempting to correct zeroed chart values with recommendation data');
        
        // Create a lookup map of recommendations by shortened title and by keywords
        const recommendationMap: Record<string, any> = {};
        const keywordMap: Record<string, any[]> = {};
        
        recommendations.forEach((rec: any) => {
          if (!rec.title) return;
          
          // Standard shortened name mapping
          const shortName = rec.title.split(' ').slice(0, 2).join(' ');
          if (shortName && rec.estimatedSavings) {
            recommendationMap[shortName] = rec;
          }
          
          // Create keyword-based lookups for more flexible matching
          const keywords = rec.title.toLowerCase().split(' ');
          keywords.forEach((kw: string) => {
            if (kw.length > 3) { // Only use meaningful keywords
              if (!keywordMap[kw]) {
                keywordMap[kw] = [];
              }
              keywordMap[kw].push(rec);
            }
          });
        });
        
        console.log('Recommendation direct mapping for correction:', recommendationMap);
        console.log('Recommendation keyword mapping:', Object.keys(keywordMap));
        
        // Apply the corrections using multiple matching strategies
        processedDataCopy.savingsAnalysis = processedDataCopy.savingsAnalysis.map(
          (item: SavingsChartDataPoint) => {
            // Skip if the item already has valid data
            if (item.estimatedSavings > 0) {
              return item;
            }
            
            if (!item.name) {
              return item;
            }
            
            // Strategy 1: Direct title match
            if (recommendationMap[item.name]) {
              const sourceRec = recommendationMap[item.name];
              console.log(`Correcting data for [${item.name}] with direct match:`, {
                originalValue: item.estimatedSavings,
                newValue: sourceRec.estimatedSavings,
                source: 'direct title match'
              });
              
              return {
                ...item,
                estimatedSavings: sourceRec.estimatedSavings,
                actualSavings: sourceRec.actualSavings || 0
              };
            }
            
            // Strategy 2: Keyword matching
            const itemKeywords = item.name.toLowerCase().split(' ');
            const matchedRecs: any[] = [];
            
            itemKeywords.forEach(kw => {
              if (kw.length > 3 && keywordMap[kw]) {
                keywordMap[kw].forEach(rec => {
                  if (!matchedRecs.includes(rec)) {
                    matchedRecs.push(rec);
                  }
                });
              }
            });
            
            if (matchedRecs.length > 0) {
              // Sort by best match (word count overlap)
              matchedRecs.sort((a, b) => {
                const aWords = a.title.toLowerCase().split(' ');
                const bWords = b.title.toLowerCase().split(' ');
                const aMatches = itemKeywords.filter(kw => aWords.includes(kw)).length;
                const bMatches = itemKeywords.filter(kw => bWords.includes(kw)).length;
                return bMatches - aMatches;
              });
              
              const bestMatch = matchedRecs[0];
              console.log(`Correcting data for [${item.name}] with keyword match:`, {
                originalValue: item.estimatedSavings,
                newValue: bestMatch.estimatedSavings,
                source: 'keyword match',
                matchedWith: bestMatch.title
              });
              
              return {
                ...item,
                estimatedSavings: bestMatch.estimatedSavings,
                actualSavings: bestMatch.actualSavings || 0
              };
            }
            
            // Strategy 3: If all else fails, use default values based on the name
            const defaultValues = getDefaultValuesByName(item.name);
            console.log(`Using default values for [${item.name}]:`, defaultValues);
            
            return {
              ...item,
              estimatedSavings: defaultValues.estimatedSavings,
              actualSavings: defaultValues.actualSavings
            };
          }
        );
        
        console.log('Corrected savings analysis data:', processedDataCopy.savingsAnalysis);
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
          <span className="text-xs ml-2 px-2 py-0.5 bg-pink-100 text-pink-800 rounded-full">v2.2</span>
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
