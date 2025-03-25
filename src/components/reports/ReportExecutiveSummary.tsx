import React from 'react';

interface ExecutiveSummaryProps {
  data: {
    totalEnergy: number;
    efficiencyScore: number;
    energyEfficiency: number;
    potentialSavings: number;
  };
}

const ReportExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ data }) => {
  // Determine efficiency rating text
  let efficiencyRating = 'Average';
  if (data.efficiencyScore >= 80) efficiencyRating = 'Excellent';
  else if (data.efficiencyScore >= 70) efficiencyRating = 'Good';
  else if (data.efficiencyScore < 60) efficiencyRating = 'Poor';

  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Executive Summary</h2>
      <div className="overflow-hidden bg-white shadow sm:rounded-lg">
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Total Energy Consumption</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {data.totalEnergy.toLocaleString()} kWh
              </dd>
            </div>
            <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Overall Efficiency Score</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {data.efficiencyScore} ({efficiencyRating})
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Energy Efficiency</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {data.energyEfficiency.toFixed(1)}%
              </dd>
            </div>
            <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Potential Annual Savings</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                ${data.potentialSavings.toLocaleString()}/year
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
};

export default ReportExecutiveSummary;
