import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';

// Type definitions for props
interface ReportHvacProps {
  auditData: any; // Using 'any' for now, but would ideally use a proper type from backend
}

const ReportHvac: React.FC<ReportHvacProps> = ({ auditData }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Helper to get efficiency color
  const getEfficiencyColor = (rating: string): string => {
    switch (rating) {
      case 'Excellent': return 'text-green-600';
      case 'Good': return 'text-green-500';
      case 'Average': return 'text-yellow-500';
      case 'Poor': return 'text-orange-500';
      case 'Very Poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };
  
  // Get ratings for systems (simplified version of the service)
  const getHeatingRating = () => {
    const system = auditData.heatingCooling?.heatingSystem;
    if (!system || !system.efficiency) return { rating: 'Unknown', color: 'text-gray-500' };
    
    const efficiency = system.efficiency;
    const isHeatPump = (system.type || '').toLowerCase().includes('heat pump');
    
    if (isHeatPump) {
      if (efficiency >= 10) return { rating: 'Excellent', color: 'text-green-600' };
      if (efficiency >= 9) return { rating: 'Good', color: 'text-green-500' };
      if (efficiency >= 8.2) return { rating: 'Average', color: 'text-yellow-500' };
      if (efficiency >= 7) return { rating: 'Poor', color: 'text-orange-500' };
      return { rating: 'Very Poor', color: 'text-red-500' };
    } else {
      // Normalize if needed
      const normalizedValue = efficiency > 100 ? efficiency / 100 : efficiency;
      
      if (normalizedValue >= 95) return { rating: 'Excellent', color: 'text-green-600' };
      if (normalizedValue >= 90) return { rating: 'Good', color: 'text-green-500' };
      if (normalizedValue >= 80) return { rating: 'Average', color: 'text-yellow-500' };
      if (normalizedValue >= 70) return { rating: 'Poor', color: 'text-orange-500' };
      return { rating: 'Very Poor', color: 'text-red-500' };
    }
  };
  
  const getCoolingRating = () => {
    const system = auditData.heatingCooling?.coolingSystem;
    if (!system || !system.efficiency) return { rating: 'Unknown', color: 'text-gray-500' };
    
    const efficiency = system.efficiency;
    const isMiniSplit = (system.type || '').toLowerCase().includes('mini-split');
    
    if (isMiniSplit) {
      if (efficiency >= 20) return { rating: 'Excellent', color: 'text-green-600' };
      if (efficiency >= 17) return { rating: 'Good', color: 'text-green-500' };
      if (efficiency >= 15) return { rating: 'Average', color: 'text-yellow-500' };
      if (efficiency >= 13) return { rating: 'Poor', color: 'text-orange-500' };
      return { rating: 'Very Poor', color: 'text-red-500' };
    } else {
      if (efficiency >= 18) return { rating: 'Excellent', color: 'text-green-600' };
      if (efficiency >= 15) return { rating: 'Good', color: 'text-green-500' };
      if (efficiency >= 13) return { rating: 'Average', color: 'text-yellow-500' };
      if (efficiency >= 10) return { rating: 'Poor', color: 'text-orange-500' };
      return { rating: 'Very Poor', color: 'text-red-500' };
    }
  };
  
  // Format efficiency values
  const formatEfficiency = (system: any, type: 'heating' | 'cooling'): string => {
    if (!system || !system.efficiency) return 'N/A';
    
    if (type === 'heating') {
      const isHeatPump = (system.type || '').toLowerCase().includes('heat pump');
      if (isHeatPump) {
        return `${system.efficiency.toFixed(1)} HSPF`;
      } else {
        // Normalize for furnaces
        const normalizedValue = system.efficiency > 100 ? system.efficiency / 100 : system.efficiency;
        return `${normalizedValue.toFixed(0)}% AFUE`;
      }
    } else { // cooling
      return `${system.efficiency.toFixed(1)} SEER`;
    }
  };
  
  // Get simple explanations text
  const getSimpleExplanations = () => ({
    cooling: "Cooling efficiency (SEER): Higher numbers mean more efficient cooling. Modern systems range from 13-25, with 15+ being energy efficient.",
    heating: "Heating efficiency: For heat pumps (HSPF): 8-10 is typical, higher is better. For furnaces (AFUE): 80-98%, with 90%+ being high efficiency.",
    tempDifference: "Temperature difference: How much your system cools or heats the air as it passes through. Proper values indicate a well-functioning system."
  });
  
  // Get advanced explanations text
  const getAdvancedExplanations = () => ({
    cooling: "SEER (Seasonal Energy Efficiency Ratio): Measures cooling output during a typical cooling season divided by energy used in watt-hours. Federal minimum is 13 SEER (14 in southern regions), with ENERGY STAR certification at 15+. Each 1-point SEER increase typically reduces energy use by 7-8%.",
    heating: "Heat pumps use HSPF (Heating Seasonal Performance Factor), with federal minimum of 8.2 and ENERGY STAR at 8.5+. Gas furnaces use AFUE (Annual Fuel Utilization Efficiency), which represents the percentage of fuel converted to heat. Federal minimum is 80% AFUE, with high-efficiency units at 90-98% AFUE.",
    tempDifference: "Delta-T (temperature differential): For cooling, ideal range is 14-22°F between return and supply air. For heating, ideal range is 25-30°F. Values outside these ranges may indicate improper refrigerant charge, airflow issues, or sizing problems.",
    technicalDetails: "EER (Energy Efficiency Ratio) measures efficiency at a specific temperature, while SEER measures performance over a season. COP (Coefficient of Performance) measures heat energy transferred per unit of input energy. For electric resistance heating, COP=1; heat pumps typically have COP of 2-4 depending on outdoor temperatures."
  });
  
  const heatingSystem = auditData.heatingCooling?.heatingSystem;
  const coolingSystem = auditData.heatingCooling?.coolingSystem;
  const heatingRating = getHeatingRating();
  const coolingRating = getCoolingRating();
  
  return (
    <section className="mb-8 bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">HVAC System Details</h2>
      
      {/* Heating System */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800">Heating System</h3>
        {heatingSystem ? (
          <div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-500">Type</p>
                <p className="font-medium">{heatingSystem.type || 'Unknown'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-500">Fuel</p>
                <p className="font-medium">{heatingSystem.fuel || 'Unknown'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-500">Age</p>
                <p className="font-medium">{heatingSystem.age || 'Unknown'} years</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-500">Efficiency</p>
                <p className="font-medium">{formatEfficiency(heatingSystem, 'heating')}</p>
              </div>
            </div>
            
            <div className={`mt-3 p-3 rounded-md ${getEfficiencyColor(heatingRating.rating).replace('text-', 'bg-').replace('600', '100')}`}>
              <div className="flex items-center">
                <p className={`font-medium ${getEfficiencyColor(heatingRating.rating)}`}>
                  Efficiency Rating: {heatingRating.rating}
                </p>
              </div>
              <p className="text-sm mt-1">
                {heatingSystem.type && heatingSystem.type.toLowerCase().includes('heat pump')
                  ? `Heat pump with ${heatingSystem.efficiency} HSPF.`
                  : `Furnace with ${heatingSystem.efficiency > 100 ? (heatingSystem.efficiency / 100).toFixed(0) : heatingSystem.efficiency}% AFUE.`}
                {' '}{heatingRating.rating === 'Excellent' && 'Exceeds ENERGY STAR requirements.'}
                {heatingRating.rating === 'Good' && 'Meets ENERGY STAR requirements.'}
                {heatingRating.rating === 'Average' && 'Meets minimum federal standards.'}
                {heatingRating.rating === 'Poor' && 'Below current standards.'}
                {heatingRating.rating === 'Very Poor' && 'Replacement recommended.'}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 italic">Heating system information not available</p>
        )}
      </div>
      
      {/* Cooling System */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800">Cooling System</h3>
        {coolingSystem ? (
          <div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-500">Type</p>
                <p className="font-medium">{coolingSystem.type || 'Unknown'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-500">Age</p>
                <p className="font-medium">{coolingSystem.age || 'Unknown'} years</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-500">Efficiency</p>
                <p className="font-medium">{formatEfficiency(coolingSystem, 'cooling')}</p>
              </div>
            </div>
            
            <div className={`mt-3 p-3 rounded-md ${getEfficiencyColor(coolingRating.rating).replace('text-', 'bg-').replace('600', '100')}`}>
              <div className="flex items-center">
                <p className={`font-medium ${getEfficiencyColor(coolingRating.rating)}`}>
                  Efficiency Rating: {coolingRating.rating}
                </p>
              </div>
              <p className="text-sm mt-1">
                {`Cooling system with ${coolingSystem.efficiency} SEER. `}
                {coolingRating.rating === 'Excellent' && 'Exceeds ENERGY STAR requirements.'}
                {coolingRating.rating === 'Good' && 'Meets ENERGY STAR requirements.'}
                {coolingRating.rating === 'Average' && 'Meets minimum federal standards.'}
                {coolingRating.rating === 'Poor' && 'Below current standards.'}
                {coolingRating.rating === 'Very Poor' && 'Replacement recommended.'}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 italic">Cooling system information not available</p>
        )}
      </div>
      
      {/* HVAC Metrics Explanation */}
      <div className="mt-6 border-t pt-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-800">HVAC Efficiency Metrics Explained</h3>
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center text-blue-600 text-sm hover:text-blue-800"
          >
            {showAdvanced ? 
              <><ChevronUp className="h-4 w-4 mr-1" /> Hide Advanced</> : 
              <><ChevronDown className="h-4 w-4 mr-1" /> Show Advanced</>
            }
          </button>
        </div>
        
        {/* Simple explanations - always shown */}
        <div className="mt-3 space-y-2">
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm"><span className="font-medium">Cooling efficiency (SEER):</span> {getSimpleExplanations().cooling}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm"><span className="font-medium">Heating efficiency:</span> {getSimpleExplanations().heating}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm"><span className="font-medium">Temperature difference:</span> {getSimpleExplanations().tempDifference}</p>
          </div>
        </div>
        
        {/* Advanced explanations - toggled */}
        {showAdvanced && (
          <div className="mt-4 border-t pt-4 space-y-3">
            <h4 className="text-base font-medium text-gray-700 flex items-center">
              <Info className="h-4 w-4 mr-1 text-blue-500" />
              Advanced Technical Details
            </h4>
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm"><span className="font-medium">SEER in detail:</span> {getAdvancedExplanations().cooling}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm"><span className="font-medium">Heating metrics in detail:</span> {getAdvancedExplanations().heating}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm"><span className="font-medium">Temperature differential in detail:</span> {getAdvancedExplanations().tempDifference}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm"><span className="font-medium">Technical efficiency measures:</span> {getAdvancedExplanations().technicalDetails}</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Standards and Recommendations */}
      <div className="mt-6 border-t pt-4">
        <h3 className="text-lg font-medium text-gray-800 mb-3">Standards & Rebate Information</h3>
        
        <div className="bg-gray-50 p-3 rounded-md mb-3">
          <p className="text-sm font-medium text-gray-700">Federal Minimum Standards</p>
          <ul className="text-sm mt-1 space-y-1">
            <li>• Central Air Conditioners: 13 SEER (14 SEER in southern regions)</li>
            <li>• Heat Pumps: 8.2 HSPF / 14 SEER minimum</li>
            <li>• Gas Furnaces: 80% AFUE minimum</li>
          </ul>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-md">
          <p className="text-sm font-medium text-gray-700">ENERGY STAR Requirements</p>
          <ul className="text-sm mt-1 space-y-1">
            <li>• Central Air Conditioners: 15+ SEER</li>
            <li>• Heat Pumps: 8.5+ HSPF / 15+ SEER</li>
            <li>• Gas Furnaces: 90%+ AFUE</li>
          </ul>
        </div>
        
        <div className="text-xs text-gray-500 italic mt-3">
          Note: Federal minimum standards are scheduled to increase in 2025. Systems meeting only current minimums may not comply with future requirements.
        </div>
      </div>
    </section>
  );
};

export default ReportHvac;
