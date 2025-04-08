import React, { useState } from 'react';
import RecommendationCard from '@/components/audit/RecommendationCard';
import { Info } from 'lucide-react';
import ProductDetailModal from '../products/ProductDetailModal';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  energyEfficiency: string;
  features: string[];
  description: string;
  imageUrl?: string;
  annualSavings: number;
  roi: number;
  paybackPeriod: number;
}

interface Recommendation {
  id: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  estimatedSavings: number;
  estimatedCost?: number;
  paybackPeriod?: number;
  implementationStatus?: string;
  products?: Product[];
  status: 'active' | 'implemented';
  actualSavings: number | null;
  implementationCost: number | null;
  implementationDate: string | null;
  lastUpdate: string;
}

interface RecommendationsTabProps {
  recommendations: Recommendation[];
  onUpdate: () => void;
}

const RecommendationsTab: React.FC<RecommendationsTabProps> = ({ recommendations, onUpdate }) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('priority');
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<string | null>(null);
  const [isProductDetailModalOpen, setIsProductDetailModalOpen] = useState(false);

  // Get unique categories
  const categories = React.useMemo(() => {
    const uniqueCategories = new Set<string>();
    recommendations.forEach(rec => uniqueCategories.add(rec.category));
    return ['all', ...Array.from(uniqueCategories)];
  }, [recommendations]);

  // Filter and sort recommendations
  const filteredRecommendations = React.useMemo(() => {
    let filtered = [...recommendations];
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(rec => rec.status === (filterStatus === 'pending' ? 'active' : filterStatus));
    }
    
    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(rec => rec.category === filterCategory);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { high: 1, medium: 2, low: 3 };
          return priorityOrder[a.priority as keyof typeof priorityOrder] - 
                 priorityOrder[b.priority as keyof typeof priorityOrder];
        case 'savings':
          return b.estimatedSavings - a.estimatedSavings;
        case 'cost':
          return (a.estimatedCost || 0) - (b.estimatedCost || 0);
        case 'payback':
          return (a.paybackPeriod || 0) - (b.paybackPeriod || 0);
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [recommendations, filterStatus, filterCategory, sortBy]);

  return (
    <div className="space-y-6">
      {/* Filters and Sorting */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="declined">Declined</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="priority">Priority</option>
              <option value="savings">Estimated Savings</option>
              <option value="cost">Implementation Cost</option>
              <option value="payback">Payback Period</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Recommendations List */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recommendations
          {filterStatus !== 'all' && ` - ${filterStatus}`}
          {filterCategory !== 'all' && ` - ${filterCategory}`}
        </h2>
        
        {filteredRecommendations.length > 0 ? (
          <div className="space-y-6">
            {filteredRecommendations.map((recommendation) => (
              <div key={recommendation.id} className="space-y-4">
                <RecommendationCard
                  recommendation={recommendation}
                  onUpdate={onUpdate}
                />
                
                {/* Display Products if available */}
                {recommendation.products && recommendation.products.length > 0 && (
                  <div className="ml-4 mt-2 border-l-2 border-green-200 pl-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Recommended Products:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {recommendation.products.map((product) => (
                        <div 
                          key={product.id}
                          className="bg-gray-50 rounded-md p-3 border border-gray-200"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-medium text-gray-900">{product.name}</h5>
                              <p className="text-xs text-gray-600 mt-1">{product.category}</p>
                              <p className="text-sm font-semibold mt-1">${product.price.toLocaleString()}</p>
                              <div className="text-xs text-green-600 mt-1">
                                Saves ${product.annualSavings.toLocaleString()}/year
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedProductForDetail(product.id);
                                setIsProductDetailModalOpen(true);
                              }}
                              className="p-1 text-blue-600 hover:text-blue-800 rounded"
                              title="View product details"
                            >
                              <Info className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <p>No recommendations match your filters.</p>
            <button
              onClick={() => {
                setFilterStatus('all');
                setFilterCategory('all');
              }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
      {/* Product Detail Modal */}
      {selectedProductForDetail && (
        <ProductDetailModal
          productId={selectedProductForDetail}
          isOpen={isProductDetailModalOpen}
          onClose={() => setIsProductDetailModalOpen(false)}
        />
      )}
    </div>
  );
};

export default RecommendationsTab;
