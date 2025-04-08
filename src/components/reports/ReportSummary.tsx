import React from 'react';
import { formatCurrency, formatPercentage } from '../../utils/financialCalculations';

interface SummaryProps {
  data: {
    totalEstimatedSavings: number | null | undefined;
    totalActualSavings: number | null | undefined;
    implementedCount: number;
    savingsAccuracy: number | null | undefined;
  };
}

const ReportSummary: React.FC<SummaryProps> = ({ data }) => {
  
  // Ensure data object exists to prevent "cannot read properties of undefined" errors
  const safeData = data || {
    totalEstimatedSavings: null,
    totalActualSavings: null,
    implementedCount: 0,
    savingsAccuracy: null
  };
  
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Summary</h2>
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
