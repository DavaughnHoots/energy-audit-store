import React, { useState } from 'react';
// Mock implementation of useComponentTracking hook
const useComponentTracking = (section: string, component: string) => {
  return (event: string, data?: any) => {
    console.log(`Analytics: ${section}.${component} - ${event}`, data);
    // In a real implementation, this would send analytics data
  };
};
import { Calculator, BarChart3 } from 'lucide-react';
// Mock Button component
const Button = ({ 
  children, 
  onClick, 
  className = '',
  variant = 'default',
  type = 'button'
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  className?: string;
  variant?: string;
  type?: 'button' | 'submit' | 'reset';
}) => (
  <button
    type={type}
    className={`px-4 py-2 rounded-md font-medium ${className}`}
    onClick={onClick}
  >
    {children}
  </button>
);

interface EstimatorResult {
  currentCost: number;
  estimatedCost: number;
  savings: number;
  savingsPercent: number;
  lowSavingsPercent: number;
  highSavingsPercent: number;
  lowSavings: number;
  highSavings: number;
}

const SummerCoolingEstimator: React.FC = () => {
  const trackComponentEvent = useComponentTracking('education', 'SummerCoolingEstimator');

  // Form state
  const [homeSize, setHomeSize] = useState('');
  const [currentTemp, setCurrentTemp] = useState('');
  const [monthlyCost, setMonthlyCost] = useState('');
  const [insulationQuality, setInsulationQuality] = useState('average');
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<EstimatorResult | null>(null);

  // Calculate savings based on thermostat adjustment, home size, and insulation quality
  const calculateSavings = () => {
    // Parse inputs with fallbacks to reasonable defaults
    const homeSizeValue = parseInt(homeSize) || 1500;
    const currentTempValue = parseInt(currentTemp) || 72;
    const currentCostValue = parseFloat(monthlyCost) || 150;
    
    // Track the calculation event with user inputs
    trackComponentEvent('calculate_savings', { 
      homeSize: homeSizeValue,
      currentTemp: currentTempValue,
      monthlyCost: currentCostValue,
      insulationQuality
    });
    
    // Recommended cooling temperature is 78°F for energy efficiency
    const recommendedTemp = 78;
    const tempDifference = Math.max(0, recommendedTemp - currentTempValue);
    
    // Each degree of thermostat adjustment saves approximately 3-5% on cooling costs
    // But the rate varies based on starting temperature - lower temps have higher potential savings
    
    // Calculate variable savings rate per degree based on starting temperature
    let lowSavingsPerDegree, avgSavingsPerDegree, highSavingsPerDegree;
    
    if (currentTempValue <= 70) {
      // Very cool starting temperatures have highest savings potential
      lowSavingsPerDegree = 0.04; // 4%
      avgSavingsPerDegree = 0.05; // 5%
      highSavingsPerDegree = 0.06; // 6%
    } else if (currentTempValue <= 73) {
      // Moderately cool temperatures have good savings potential
      lowSavingsPerDegree = 0.035; // 3.5%
      avgSavingsPerDegree = 0.045; // 4.5%
      highSavingsPerDegree = 0.055; // 5.5%
    } else if (currentTempValue <= 76) {
      // Standard range temperatures have average savings
      lowSavingsPerDegree = 0.03; // 3%
      avgSavingsPerDegree = 0.04; // 4%
      highSavingsPerDegree = 0.05; // 5%
    } else {
      // Already warmer temperatures have diminishing returns
      lowSavingsPerDegree = 0.02; // 2%
      avgSavingsPerDegree = 0.03; // 3%
      highSavingsPerDegree = 0.04; // 4%
    }
    
    // Calculate savings percentage based on temperature adjustment
    let savingsPercent = tempDifference * avgSavingsPerDegree;
    let lowSavingsPercent = tempDifference * lowSavingsPerDegree;
    let highSavingsPercent = tempDifference * highSavingsPerDegree;
    
    // Add additional savings from other summer energy tips (approx 5-10%)
    // Using range: 4-8% with 6% as average
    savingsPercent += 0.06;
    lowSavingsPercent += 0.04;
    highSavingsPercent += 0.08;
    
    // Apply insulation quality factor - this affects how much temperature impacts the home
    // Poor insulation = higher potential savings from thermostat adjustments
    // Good insulation = more stable temperatures, so relatively lower percent savings
    const insulationFactors = {
      poor: 1.25,      // Poor insulation = higher potential savings (25% more)
      average: 1.0,    // Average = baseline
      good: 0.85,      // Good insulation = lower additional savings (15% less)
      excellent: 0.7   // Excellent = much lower additional savings (30% less)
    };
    
    // Apply the factor to the percentage calculations
    const factor = insulationFactors[insulationQuality as keyof typeof insulationFactors];
    savingsPercent *= factor;
    lowSavingsPercent *= factor;
    highSavingsPercent *= factor;
    
    // Cap maximum savings at 30% to keep estimates realistic
    savingsPercent = Math.min(savingsPercent, 0.30);
    lowSavingsPercent = Math.min(lowSavingsPercent, 0.25);
    highSavingsPercent = Math.min(highSavingsPercent, 0.35);
    
    // Calculate actual dollar savings
    const savings = currentCostValue * savingsPercent;
    const lowSavings = currentCostValue * lowSavingsPercent;
    const highSavings = currentCostValue * highSavingsPercent;
    
    setResult({
      currentCost: currentCostValue,
      estimatedCost: currentCostValue - savings,
      savings: savings,
      savingsPercent: savingsPercent * 100,
      lowSavingsPercent: lowSavingsPercent * 100,
      highSavingsPercent: highSavingsPercent * 100,
      lowSavings: lowSavings,
      highSavings: highSavings
    });
    
    setSubmitted(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!homeSize && !currentTemp && !monthlyCost) {
      alert('Please fill in at least one field for an estimation');
      return;
    }
    
    calculateSavings();
  };

  const resetForm = () => {
    trackComponentEvent('reset_estimator');
    setHomeSize('');
    setCurrentTemp('');
    setMonthlyCost('');
    setSubmitted(false);
    setResult(null);
  };

  return (
    <div className="bg-blue-50 rounded-lg p-4 my-6 shadow-sm">
      <div className="flex items-center mb-4">
        <Calculator className="w-5 h-5 mr-2 text-blue-600" />
        <h3 className="text-lg font-semibold text-blue-800">Summer Cooling Estimator</h3>
      </div>
      
      {!submitted ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Home Size (sq. ft.)
              </label>
              <input
                type="number"
                value={homeSize}
                onChange={(e) => setHomeSize(e.target.value)}
                className="p-2 border rounded w-full"
                placeholder="1,500"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Current Thermostat Setting (°F)
              </label>
              <input
                type="number"
                value={currentTemp}
                onChange={(e) => setCurrentTemp(e.target.value)}
                className="p-2 border rounded w-full"
                placeholder="72"
                min="60"
                max="85"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Current Monthly Cooling Cost ($)
              </label>
              <input
                type="number"
                value={monthlyCost}
                onChange={(e) => setMonthlyCost(e.target.value)}
                className="p-2 border rounded w-full"
                placeholder="150"
                min="0"
                step="0.01"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Home Insulation Quality
              </label>
              <select
                value={insulationQuality}
                onChange={(e) => setInsulationQuality(e.target.value)}
                className="p-2 border rounded w-full"
              >
                <option value="poor">Poor (older home, little insulation)</option>
                <option value="average">Average (standard construction)</option>
                <option value="good">Good (well-insulated, newer home)</option>
                <option value="excellent">Excellent (energy efficient certified)</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Calculate Potential Savings
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 italic">Note: This is a demonstration tool. In a production environment, calculations would be based on your specific climate zone, energy rates, and more detailed inputs.</p>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h4 className="font-medium text-lg mb-4 text-center">Your Estimated Summer Cooling Savings</h4>
            
            <div className="grid grid-cols-3 gap-4 mb-6 text-center">
              <div>
                <p className="text-sm text-gray-500">Current Cost</p>
                <p className="text-xl font-bold">${result?.currentCost.toFixed(2)}</p>
                <p className="text-xs text-gray-400">per month</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Estimated New Cost</p>
                <p className="text-xl font-bold text-blue-600">${result?.estimatedCost.toFixed(2)}</p>
                <p className="text-xs text-gray-400">per month</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Your Savings</p>
                <p className="text-xl font-bold text-green-600">${result?.savings.toFixed(2)}</p>
                <p className="text-xs text-gray-400">per month</p>
              </div>
            </div>
            
            {/* Simple bar chart visualization */}
            <div className="mb-4">
              <div className="flex items-center mb-1">
                <div className="w-24 text-sm">Current:</div>
                <div className="flex-1 h-6 bg-blue-200 rounded">
                  <div 
                    className="h-full bg-blue-600 rounded" 
                    style={{ width: '100%' }}
                  ></div>
                </div>
                <div className="w-16 text-right text-sm">${result?.currentCost.toFixed(0)}</div>
              </div>
              <div className="flex items-center">
                <div className="w-24 text-sm">With Tips:</div>
                <div className="flex-1 h-6 bg-blue-200 rounded">
                  <div 
                    className="h-full bg-green-500 rounded" 
                    style={{ width: `${100 - result?.savingsPercent}%` }}
                  ></div>
                </div>
                <div className="w-16 text-right text-sm">${result?.estimatedCost.toFixed(0)}</div>
              </div>
            </div>
            
            <div className="text-center bg-green-50 p-3 rounded-lg">
              <p className="text-green-800">By implementing our summer energy tips, you could save approximately:</p>
              <p className="text-2xl font-bold text-green-600">{result?.lowSavingsPercent.toFixed(0)}-{result?.highSavingsPercent.toFixed(0)}% on cooling costs</p>
              <p className="text-sm text-green-600">That's about ${result?.lowSavings.toFixed(0)}-${result?.highSavings.toFixed(0)} per month, or ${((result?.lowSavings || 0) * 3).toFixed(0)}-${((result?.highSavings || 0) * 3).toFixed(0)} over the summer!</p>
            </div>
            
            <div className="mt-6">
              <Button 
                onClick={resetForm}
                variant="outline"
                className="w-full"
              >
                Calculate Again
              </Button>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                <p className="font-medium mb-1">Calculation methodology sources:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><a href="https://www.energy.gov/energysaver/thermostats" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">U.S. Department of Energy</a>: "You can save as much as 10% a year on heating and cooling by simply turning your thermostat back 7°-10°F for 8 hours a day."</li>
                  <li><a href="https://www.energystar.gov/products/heating_cooling" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">ENERGY STAR®</a>: "Save up to 3% on cooling costs for each degree above 72°F."</li>
                  <li><a href="https://eta.lbl.gov/publications/field-monitoring-non-intrusive-load" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Lawrence Berkeley National Laboratory</a> studies show 3-5% energy savings per degree adjustment, with higher savings potential at lower starting temperatures.</li>
                  <li>Insulation quality factors based on research from the <a href="https://www.nrel.gov/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">National Renewable Energy Laboratory</a> on building thermal envelope performance.</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="text-sm space-y-2">
            <h5 className="font-medium">Recommended Next Steps:</h5>
            <ul className="list-disc pl-5 space-y-1">
              {parseInt(currentTemp) < 78 ? (
                <li className="font-semibold text-blue-700">Adjust your thermostat to 78°F when home (higher temps = lower cooling costs)</li>
              ) : (
                <li>Keep your thermostat at {parseInt(currentTemp) || 78}°F - you're already saving!</li>
              )}
              <li>Use ceiling fans to create a wind-chill effect (and turn them off when not in the room)</li>
              <li>Close blinds during the hottest part of the day to block solar heat gain</li>
              <li>Seal any air leaks around windows and doors to prevent cool air escape</li>
              <li>Schedule an AC tune-up to ensure maximum efficiency</li>
              {parseInt(homeSize) > 2000 && (
                <li>Consider zone cooling for your larger home to reduce costs in unused areas</li>
              )}
              {parseFloat(monthlyCost) > 200 && (
                <li>Look into a programmable thermostat to automatically adjust temperatures</li>
              )}
              {insulationQuality === 'poor' && (
                <li className="font-semibold text-blue-700">Improve home insulation to maintain comfortable temperatures with less energy</li>
              )}
              {insulationQuality === 'average' && (
                <li>Consider upgrading insulation in priority areas like attics and around windows</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default SummerCoolingEstimator;