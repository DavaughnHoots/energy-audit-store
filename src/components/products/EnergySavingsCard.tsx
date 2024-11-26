// src/components/products/EnergySavingsCard.tsx
import React from 'react';

interface EnergySavingsCardProps {
  annualSavings: number;
}

export const EnergySavingsCard: React.FC<EnergySavingsCardProps> = ({ annualSavings }) => {
  return (
    <div className="mt-12 bg-green-50 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Estimated Energy Savings
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="text-center p-4 bg-white rounded-lg shadow-sm">
          <p className="text-sm text-gray-600 mb-2">Annual Energy Savings</p>
          <p className="text-3xl font-bold text-green-600">${annualSavings}</p>
        </div>
        <div className="text-center p-4 bg-white rounded-lg shadow-sm">
          <p className="text-sm text-gray-600 mb-2">10-Year Savings</p>
          <p className="text-3xl font-bold text-green-600">
            ${annualSavings * 10}
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm text-gray-600">
        *Savings estimates based on average usage patterns. Actual savings may vary.
      </p>
    </div>
  );
};