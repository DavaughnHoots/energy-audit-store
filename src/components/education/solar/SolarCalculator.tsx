import React, { useState } from 'react';
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";

// Solar irradiance data by region (kWh/m²/day)
const solarIrradianceData = {
  northeast: 4.2,
  midwest: 4.4,
  southeast: 5.0,
  southwest: 5.7,
  west: 5.2,
  northwest: 4.0,
};

// Average electricity rates by region ($/kWh)
const electricityRates = {
  northeast: 0.21,
  midwest: 0.14,
  southeast: 0.13,
  southwest: 0.12,
  west: 0.19,
  northwest: 0.11,
};

// Orientation efficiency factors
const orientationFactors = {
  south: 1.0,
  southeast: 0.9,
  southwest: 0.9,
  east: 0.8,
  west: 0.8,
  north: 0.6,
  flat: 0.9,
};

interface SolarCalculatorProps {
  onComplete?: (result: {
    systemSize: number;
    annualProduction: number;
    monthlySavings: number;
    co2Reduction: number;
    paybackPeriod: number;
  }) => void;
}

export default function SolarCalculator({ onComplete }: SolarCalculatorProps) {
  // Form state
  const [formData, setFormData] = useState({
    roofArea: 800, // Default: 800 sq ft
    region: 'southeast',
    monthlyBill: 150, // Default: $150/month
    orientation: 'south',
  });

  // Results state
  const [results, setResults] = useState<null | {
    systemSize: number;
    annualProduction: number;
    monthlySavings: number;
    co2Reduction: number;
    paybackPeriod: number;
  }>(null);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: name === 'roofArea' || name === 'monthlyBill' ? Number(value) : value,
    });
  };

  // Calculate solar potential
  const calculateSolarPotential = () => {
    // Get the appropriate factors based on region and orientation
    const regionIrradiance = solarIrradianceData[formData.region as keyof typeof solarIrradianceData];
    const orientationFactor = orientationFactors[formData.orientation as keyof typeof orientationFactors];
    const electricityRate = electricityRates[formData.region as keyof typeof electricityRates];
    
    // Usable roof area (accounting for setbacks, etc)
    const usableRoofArea = formData.roofArea * 0.7; // Assume 70% of roof area is usable
    
    // System size calculation (kW) - 1kW typically needs around 100 sq ft
    const systemSize = (usableRoofArea / 100) * orientationFactor;
    
    // Annual production calculation (kWh)
    // Formula: System size (kW) × irradiance (kWh/m²/day) × 365 days × system efficiency (0.77)
    const systemEfficiency = 0.77; // accounts for inverter losses, wiring losses, etc.
    const annualProduction = systemSize * regionIrradiance * 365 * systemEfficiency;
    
    // Monthly savings
    const monthlySavings = (annualProduction / 12) * electricityRate;
    
    // CO2 reduction (lbs/year)
    // Average US electricity carbon intensity: 0.92 lbs CO2 per kWh
    const co2Reduction = annualProduction * 0.92;
    
    // Payback period (years)
    // Assuming $3 per watt installation cost for residential solar
    const installationCost = systemSize * 1000 * 3; // Convert kW to W, then multiply by cost per W
    const annualSavings = monthlySavings * 12;
    // Factor in 30% federal tax credit
    const netCost = installationCost * 0.7;
    const paybackPeriod = netCost / annualSavings;
    
    const results = {
      systemSize: parseFloat(systemSize.toFixed(1)),
      annualProduction: Math.round(annualProduction),
      monthlySavings: parseFloat(monthlySavings.toFixed(2)),
      co2Reduction: Math.round(co2Reduction),
      paybackPeriod: parseFloat(paybackPeriod.toFixed(1)),
    };
    
    setResults(results);
    
    if (onComplete) {
      onComplete(results);
    }
  };

  return (
    <div className="my-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">☀️ Solar Potential Calculator</CardTitle>
          <p className="text-sm text-gray-600">Estimate how much solar power your home could generate and save</p>
        </CardHeader>
        <CardContent>
          {!results ? (
            <form 
              onSubmit={(e) => { 
                e.preventDefault(); 
                calculateSolarPotential(); 
              }}
              className="space-y-4"
            >
              {/* Roof Area Input */}
              <div>
                <label htmlFor="roofArea" className="block text-sm font-medium text-gray-700 mb-1">
                  Roof Area (approx. sq ft)
                </label>
                <input
                  type="number"
                  id="roofArea"
                  name="roofArea"
                  value={formData.roofArea}
                  onChange={handleInputChange}
                  min="100"
                  max="10000"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">
                  For reference, a typical 2000 sq ft home has about 800-1200 sq ft of roof area.
                </p>
              </div>

              {/* Region Selection */}
              <div>
                <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
                  Region
                </label>
                <select
                  id="region"
                  name="region"
                  value={formData.region}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="northeast">Northeast (NY, MA, CT, etc)</option>
                  <option value="midwest">Midwest (IL, OH, MI, etc)</option>
                  <option value="southeast">Southeast (FL, GA, SC, etc)</option>
                  <option value="southwest">Southwest (TX, AZ, NM, etc)</option>
                  <option value="west">West (CA, NV, etc)</option>
                  <option value="northwest">Northwest (WA, OR, etc)</option>
                </select>
              </div>

              {/* Monthly Bill Input */}
              <div>
                <label htmlFor="monthlyBill" className="block text-sm font-medium text-gray-700 mb-1">
                  Average Monthly Electric Bill ($)
                </label>
                <input
                  type="number"
                  id="monthlyBill"
                  name="monthlyBill"
                  value={formData.monthlyBill}
                  onChange={handleInputChange}
                  min="30"
                  max="1000"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* Roof Orientation */}
              <div>
                <label htmlFor="orientation" className="block text-sm font-medium text-gray-700 mb-1">
                  Main Roof Orientation
                </label>
                <select
                  id="orientation"
                  name="orientation"
                  value={formData.orientation}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="south">South Facing (Optimal)</option>
                  <option value="southeast">Southeast Facing</option>
                  <option value="southwest">Southwest Facing</option>
                  <option value="east">East Facing</option>
                  <option value="west">West Facing</option>
                  <option value="north">North Facing</option>
                  <option value="flat">Flat Roof</option>
                </select>
              </div>

              <div className="pt-3">
                <Button 
                  type="submit"
                  className="w-full"
                >
                  Calculate Solar Potential
                </Button>
              </div>
            </form>
          ) : (
            <div>
              {/* Results Display */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-1">Estimated System</h3>
                  <p className="text-3xl font-bold text-green-600 mb-1">{results.systemSize} kW</p>
                  <p className="text-sm text-gray-600">System Size</p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-1">Annual Production</h3>
                  <p className="text-3xl font-bold text-blue-600 mb-1">{results.annualProduction.toLocaleString()} kWh</p>
                  <p className="text-sm text-gray-600">Electricity Generated</p>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-1">Monthly Savings</h3>
                  <p className="text-3xl font-bold text-yellow-600 mb-1">${results.monthlySavings}</p>
                  <p className="text-sm text-gray-600">On Electric Bill</p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-1">Payback Period</h3>
                  <p className="text-3xl font-bold text-purple-600 mb-1">{results.paybackPeriod} years</p>
                  <p className="text-sm text-gray-600">After Tax Credits</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-lg mb-1">Environmental Impact</h3>
                <p className="text-xl mb-2">
                  Your system would prevent <span className="font-bold text-green-600">{results.co2Reduction.toLocaleString()} lbs</span> of CO₂ emissions per year.
                </p>
                <p className="text-sm text-gray-600">
                  That's equivalent to planting about {Math.round(results.co2Reduction / 50)} trees!
                </p>
              </div>

              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setResults(null)}
                >
                  Recalculate
                </Button>
                <Button>
                  Get a Free Solar Quote
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 mt-4">
                Note: These calculations provide estimates based on typical values. Actual results may vary based on specific site conditions, equipment selected, and other factors. Professional assessment is recommended.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
