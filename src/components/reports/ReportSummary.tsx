import React from 'react';

interface SummaryProps {
  data: {
    totalEstimatedSavings: number | null | undefined;
    totalActualSavings: number | null | undefined;
    implementedCount: number;
    savingsAccuracy: number | null | undefined;
  };
}

const ReportSummary: React.FC<SummaryProps> = ({ data }) => {
  // Helper function to safely format currency values
  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return 'N/A';
    return `$${value.toLocaleString()}`;
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
                {formatCurrency(data.totalEstimatedSavings)}
              </dd>
            </div>
            <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Total Actual Annual Savings</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {formatCurrency(data.totalActualSavings)}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Implemented Recommendations</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {data.implementedCount}
              </dd>
            </div>
            <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Savings Accuracy</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {data.savingsAccuracy !== null && data.savingsAccuracy !== undefined ? `${data.savingsAccuracy.toFixed(1)}%` : 'N/A'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
};

export default ReportSummary;
