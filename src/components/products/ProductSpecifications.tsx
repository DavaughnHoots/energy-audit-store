// src/components/products/ProductSpecifications.tsx
import React from 'react';

interface ProductSpecificationsProps {
  specifications: Record<string, string | number>;
}

export const ProductSpecifications: React.FC<ProductSpecificationsProps> = ({ specifications }) => {
  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Specifications</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(specifications).map(([key, value]) => (
          <div 
            key={key}
            className="flex justify-between p-4 bg-gray-50 rounded-lg"
          >
            <span className="text-gray-600">{key}</span>
            <span className="font-medium">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
