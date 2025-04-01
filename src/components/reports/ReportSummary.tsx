import React, { useEffect, useState } from 'react';
import { formatCurrency, formatPercentage } from '../../utils/financialCalculations';
import { AuditRecommendation } from '../../types/energyAudit';

interface SummaryProps {
  data: {
    totalEstimatedSavings: number | null | undefined;
    totalActualSavings: number | null | undefined;
    implementedCount: number;
    savingsAccuracy: number | null | undefined;
  };
  recommendations?: AuditRecommendation[]; // Optional recommendations for data validation
}

const ReportSummary: React.FC<SummaryProps> = ({ data, recommendations = [] }) => {
  const [processedData, setProcessedData] = useState(data);
  
  // Enhanced logging for debugging data consistency issues
  useEffect(() => {
    console.log('ReportSummary v2.0 mounted with data:', {
      originalData: data,
      recommendationsAvailable: recommendations.length,
      recommendationsSavings: recommendations.map(r => ({ 
        title: r.title,
        estimatedSavings: r.estimatedSavings,
        actualSavings: r.actualSavings
      }))
    });
    
    // Create a deep copy to avoid modifying the original data
    const processedDataCopy = { ...data };
    
    // Check if we need to recalculate the summary data
    const needsRecalculation = 
      !data.totalEstimatedSavings || 
      data.totalEstimatedSavings === 0 || 
      !data.totalActualSavings || 
      data.implementedCount === 0;
    
    if (needsRecalculation && recommendations.length > 0) {
      console.log('Data validation: Summary data needs recalculation');
      
      // Recalculate estimated savings from recommendations
      const calculatedEstimatedSavings = recommendations.reduce((sum, rec) => {
        const savings = rec.estimatedSavings || 0;
        console.log(`Adding ${rec.title} estimated savings: ${savings}`);
        return sum + savings;
      }, 0);
      
      // Recalculate actual savings and count of implemented recommendations
      let calculatedActualSavings = 0;
      let calculatedImplementedCount = 0;
      
      recommendations.forEach(rec => {
        if (rec.status === 'implemented') {
          calculatedImplementedCount++;
          if (rec.actualSavings) {
            calculatedActualSavings += rec.actualSavings;
            console.log(`Adding ${rec.title} actual savings: ${rec.actualSavings}`);
          }
        }
      });
      
      // Calculate savings accuracy if we have both values
      let calculatedSavingsAccuracy = null;
      if (calculatedEstimatedSavings > 0 && calculatedActualSavings > 0) {
        calculatedSavingsAccuracy = calculatedActualSavings / calculatedEstimatedSavings;
      }
      
      console.log('Recalculated summary data:', {
        totalEstimatedSavings: calculatedEstimatedSavings,
        totalActualSavings: calculatedActualSavings,
        implementedCount: calculatedImplementedCount,
        savingsAccuracy: calculatedSavingsAccuracy
      });
      
      // Update the processed data
      processedDataCopy.totalEstimatedSavings = calculatedEstimatedSavings || data.totalEstimatedSavings;
      processedDataCopy.totalActualSavings = calculatedActualSavings || data.totalActualSavings;
      processedDataCopy.implementedCount = calculatedImplementedCount || data.implementedCount;
      processedDataCopy.savingsAccuracy = calculatedSavingsAccuracy || data.savingsAccuracy;
    } else {
      console.log('Using original summary data (no recalculation needed)');
    }
    
    // Update the state with processed data
    setProcessedData(processedDataCopy);
  }, [data, recommendations]);
  
  // Ensure data object exists to prevent "cannot read properties of undefined" errors
  const safeData = processedData || {
    totalEstimatedSavings: null,
    totalActualSavings: null,
    implementedCount: 0,
    savingsAccuracy: null
  };
  
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">
        Summary
        <span className="text-xs ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">v2.0</span>
      </h2>
      <div className="overflow-hidden bg-white shadow sm:rounded-lg">
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Total Estimated Annual Savings</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {formatCurrency(safeData.totalEstimatedSavings)}
              </dd>
            </div>
            <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Total Actual Annual Savings</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {formatCurrency(safeData.totalActualSavings)}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Implemented Recommendations</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {safeData.implementedCount || 0}
              </dd>
            </div>
            <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Savings Accuracy</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {formatPercentage(safeData.savingsAccuracy)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
};

export default ReportSummary;
