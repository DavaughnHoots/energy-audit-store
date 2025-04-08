// src/pages/ProductDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileDown, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';
import { ProductDetailHeader } from '../components/products/ProductDetailHeader';
import { ProductSpecifications } from '../components/products/ProductSpecifications';
import { EnergySavingsCard } from '../components/products/EnergySavingsCard';
import { useProducts } from '../hooks/useProducts';
import { Product } from '../../backend/src/types/product';
import { usePageTracking } from '../hooks/analytics/usePageTracking';

const ProductDetailPage: React.FC = () => {
  // Add page tracking
  usePageTracking('products');
  
  const { id } = useParams<{ id: string }>();
  const { getProduct, isLoading } = useProducts();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        if (!id) throw new Error('Product ID is required');
        const productData = await getProduct(id);
        if (!productData) throw new Error('Product not found');
        setProduct(productData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
      }
    };

    loadProduct();
  }, [id, getProduct]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>{error || 'Product not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Calculate estimated savings
  // This is a placeholder calculation - adjust based on actual energy efficiency data
  const estimatedAnnualSavings = Math.round(
    parseFloat(product.efficiency.replace(/[^\d.]/g, '')) * 100
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Back Navigation */}
      <div className="mb-6">
        <Link
          to="/products"
          className="inline-flex items-center text-green-600 hover:text-green-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Link>
      </div>

      {/* Main Product Content */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <ProductDetailHeader product={product} />

        {/* Features Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Features</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {product.features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span className="text-gray-600">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Specifications */}
        <ProductSpecifications specifications={product.specifications} />

        {/* Energy Savings Estimate */}
        <EnergySavingsCard annualSavings={estimatedAnnualSavings} />

        {/* Additional Resources */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Additional Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {product.pdfUrl && (
              <a
                href={product.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
              >
                <FileDown className="h-6 w-6 text-green-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Product Specification Sheet</p>
                  <p className="text-sm text-gray-500">Download detailed specifications (PDF)</p>
                </div>
              </a>
            )}

            <a
              href={product.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
            >
              <div>
                <p className="font-medium text-gray-900">ENERGY STAR Product Details</p>
                <p className="text-sm text-gray-500">View complete product information</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;