// src/components/education/ContinueLearningSection.tsx
import React, { useState, useEffect } from 'react';
import { EducationalResource } from '@/types/education';
import { educationService } from '@/services/educationService';
import ResourceCard from './ResourceCard';
import useAuth from '@/context/AuthContext';
import { Loader2, BookOpen, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ContinueLearningProps {
  className?: string;
}

const ContinueLearningSection: React.FC<ContinueLearningProps> = ({ className = '' }) => {
  const [inProgressResources, setInProgressResources] = useState<EducationalResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const loadInProgressResources = async () => {
      try {
        setLoading(true);
        const resources = await educationService.getInProgressResources();
        setInProgressResources(resources);
        setError(null);
      } catch (err) {
        console.error('Error loading in-progress resources:', err);
        setError('Failed to load your learning progress. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadInProgressResources();
  }, [isAuthenticated]);

  // Not authenticated or no in-progress resources
  if (!isAuthenticated || (!loading && inProgressResources.length === 0)) {
    return null; // Don't show the component at all
  }

  // Loading state
  if (loading) {
    return (
      <div className={cn("mb-10", className)}>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Continue Learning</h2>
        <div className="bg-white rounded-lg shadow-sm p-6 flex justify-center items-center">
          <Loader2 className="h-8 w-8 text-green-500 animate-spin" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn("mb-10", className)}>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Continue Learning</h2>
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-gray-600 mb-4">{error}</p>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Resources view
  return (
    <div className={cn("mb-10", className)}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Continue Learning</h2>
        <Button variant="ghost" className="text-sm flex items-center gap-1">
          View All <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {inProgressResources.map((resource) => (
          <ResourceCard 
            key={resource.id} 
            resource={resource}
            showProgress={true}
          />
        ))}
      </div>
    </div>
  );
};

export default ContinueLearningSection;
