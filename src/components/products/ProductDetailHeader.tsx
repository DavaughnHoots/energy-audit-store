// src/components/products/ProductDetailHeader.tsx
import React from 'react';
import { Product } from '../../../backend/src/types/product';
import { Badge } from '../ui/badge';

interface ProductDetailHeaderProps {
  product: Product;
}

export const ProductDetailHeader: React.FC<ProductDetailHeaderProps> = ({ product }) => {
  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div className="w-full md:w-1/2">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-96 object-cover rounded-lg shadow-md"
        />
      </div>

      <div className="w-full md:w-1/2 space-y-4">
        <div className="flex justify-between items-start">
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
          <Badge variant="outline" className="bg-green-50">
            {product.energyRating}
          </Badge>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-gray-900">${product.price}</span>
          {product.rebateAmount > 0 && (
            <span className="text-green-600 font-medium">
              ${product.rebateAmount} rebate available
            </span>
          )}
        </div>

        <p className="text-gray-600">{product.description}</p>

        <div className="border-t border-b py-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Brand</span>
            <span className="font-medium">{product.brand}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Model Number</span>
            <span className="font-medium">{product.modelNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Warranty</span>
            <span className="font-medium">{product.warrantyYears} years</span>
          </div>
        </div>

        <a
            href={product.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 text-center"
            >
            View on Retailer Site
            </a>
      </div>
    </div>
  );
};