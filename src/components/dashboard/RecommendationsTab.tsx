import React from 'react';
import RecommendationCard from '@/components/audit/RecommendationCard';

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
  products?: any[];
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
  const [filterStatus, setFilterStatus] = React.useState<string>('all');
  const [filterCategory, setFilterCategory] = React.useState<string>('all');
  const [sortBy, setSortBy] = React.useState<string>('priority');

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
          <div className="space-y-4">
            {filteredRecommendations.map((recommendation) => (
              <RecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
                onUpdate={onUpdate}
              />
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
    </div>
  );
};

export default RecommendationsTab;
